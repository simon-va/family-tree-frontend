import { afterNextRender, Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { Cluster, MarkerClusterer, MarkerClustererOptions, Renderer } from '@googlemaps/markerclusterer';
import { Residence, ResidenceLocationEntry } from '../../../shared/residences/residence.model';
import { ResidencesStore } from '../../../shared/residences/residences.store';
import { SidePanelService } from '../side-panel/side-panel.service';

class ExposedMarkerClusterer extends MarkerClusterer {
  constructor(options: MarkerClustererOptions) {
    super(options);
  }
  getClusters(): Cluster[] {
    return this.clusters;
  }
}

interface MoveEdge {
  from: Residence;
  to: Residence;
}

type AdvancedMarker = google.maps.marker.AdvancedMarkerElement;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent {
  private readonly residencesStore = inject(ResidencesStore);
  private readonly sidePanelService = inject(SidePanelService);
  private readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  private map: google.maps.Map | null = null;
  private clusterer: ExposedMarkerClusterer | null = null;
  private markerData = new WeakMap<AdvancedMarker, ResidenceLocationEntry>();
  private markerByResidenceId = new Map<string, AdvancedMarker>();
  private moveLines: google.maps.Polyline[] = [];
  private currentEdges: MoveEdge[] = [];

  constructor() {
    afterNextRender(() => this.initMap());

    effect(() => {
      const residences = this.residencesStore.residences();
      if (!this.map) return;
      this.renderMarkers(residences);
    });
  }

  private createMarkerContent(color: string): HTMLElement {
    const el = document.createElement('div');
    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 22.3 12.5 41 12.5 41S25 22.3 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="4.5" fill="white"/>
    </svg>`;
    return el;
  }

  private initMap(): void {
    const el = this.mapContainer()?.nativeElement;
    if (!el) return;

    // mapId is required for AdvancedMarkerElement — replace DEMO_MAP_ID with a real Map ID from Google Cloud Console
    this.map = new google.maps.Map(el, {
      center: { lat: 50, lng: 10 },
      zoom: 5,
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapId: 'b513a364f3220e049a6f54a0',
    });

    const renderer: Renderer = {
      render: ({ position }) =>
        new google.maps.marker.AdvancedMarkerElement({
          position,
          content: this.createMarkerContent('#3b82f6'),
        }),
    };

    this.clusterer = new ExposedMarkerClusterer({
      map: this.map,
      renderer,
      onClusterClick: (_e, cluster) => this.onClusterClick(cluster),
    });

    this.map.addListener('idle', () => this.renderMoveLines());

    this.renderMarkers(this.residencesStore.residences());
  }

  private groupResidences(residences: Residence[]): ResidenceLocationEntry[] {
    const grouped = new Map<string, ResidenceLocationEntry>();
    for (const r of residences) {
      if (r.lat == null || r.lng == null) continue;
      const key = `${r.lat},${r.lng}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.residences.push(r);
      } else {
        grouped.set(key, { lat: r.lat, lng: r.lng, residences: [r] });
      }
    }
    return [...grouped.values()];
  }

  private renderMarkers(residences: Residence[]): void {
    if (!this.clusterer || !this.map) return;
    this.clusterer.clearMarkers();
    this.markerData = new WeakMap();
    this.markerByResidenceId = new Map();

    const groups = this.groupResidences(residences);
    const markers: AdvancedMarker[] = [];

    for (const group of groups) {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: group.lat, lng: group.lng },
        content: this.createMarkerContent('#22c55e'),
      });

      this.markerData.set(marker, group);
      for (const r of group.residences) {
        this.markerByResidenceId.set(r.id, marker);
      }

      marker.addListener('click', () =>
        this.sidePanelService.open({ type: 'residence-location', locations: [group] }),
      );

      markers.push(marker);
    }

    this.clusterer.addMarkers(markers);
    this.currentEdges = this.computeMoveEdges(residences);
  }

  private computeMoveEdges(residences: Residence[]): MoveEdge[] {
    const byId = new Map<string, Residence>(residences.map((r) => [r.id, r]));
    const edges: MoveEdge[] = [];

    for (const from of residences) {
      if (!from.movedToResidenceId) continue;
      if (from.lat == null || from.lng == null) continue;
      const to = byId.get(from.movedToResidenceId);
      if (!to || to.lat == null || to.lng == null) continue;
      if (from.lat === to.lat && from.lng === to.lng) continue;
      edges.push({ from, to });
    }

    return edges;
  }

  private getClusterForMarker(marker: AdvancedMarker): Cluster | null {
    if (!this.clusterer) return null;
    for (const cluster of this.clusterer.getClusters()) {
      if (cluster.markers?.includes(marker)) return cluster;
    }
    return null;
  }

  private toLatLng(pos: google.maps.LatLng | google.maps.LatLngLiteral): google.maps.LatLng {
    return pos instanceof google.maps.LatLng
      ? pos
      : new google.maps.LatLng((pos as google.maps.LatLngLiteral).lat, (pos as google.maps.LatLngLiteral).lng);
  }

  private renderMoveLines(): void {
    if (!this.map) return;

    for (const line of this.moveLines) line.setMap(null);
    this.moveLines = [];

    const drawn = new Set<string>();

    for (const edge of this.currentEdges) {
      const fromMarker = this.markerByResidenceId.get(edge.from.id);
      const toMarker = this.markerByResidenceId.get(edge.to.id);
      if (!fromMarker || !toMarker) continue;

      const fromCluster = this.getClusterForMarker(fromMarker);
      const toCluster = this.getClusterForMarker(toMarker);
      if (!fromCluster || !toCluster) continue;
      if (fromCluster === toCluster) continue;

      const fromLatLng = this.toLatLng(fromCluster.position);
      const toLatLng = this.toLatLng(toCluster.position);
      const dedupeKey = `${fromLatLng.lat()},${fromLatLng.lng()}->${toLatLng.lat()},${toLatLng.lng()}`;
      if (drawn.has(dedupeKey)) continue;
      drawn.add(dedupeKey);

      const line = new google.maps.Polyline({
        path: [fromLatLng, toLatLng],
        strokeColor: '#6366f1',
        strokeWeight: 2,
        strokeOpacity: 0.6,
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
              strokeColor: '#6366f1',
              fillColor: '#6366f1',
              fillOpacity: 0.8,
              strokeWeight: 1,
              scale: 3,
            },
            offset: '100%',
          },
        ],
        map: this.map,
      });

      this.moveLines.push(line);
    }
  }

  private onClusterClick(cluster: Cluster): void {
    const grouped = new Map<string, ResidenceLocationEntry>();

    for (const marker of (cluster.markers ?? []) as AdvancedMarker[]) {
      const entry = this.markerData.get(marker);
      if (!entry) continue;
      const key = `${entry.lat},${entry.lng}`;
      if (!grouped.has(key)) {
        grouped.set(key, { lat: entry.lat, lng: entry.lng, residences: [...entry.residences] });
      }
    }

    const locations = [...grouped.values()];
    if (locations.length > 0) {
      this.sidePanelService.open({ type: 'residence-location', locations });
    }
  }
}
