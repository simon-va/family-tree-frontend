import { afterNextRender, Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet-polylinedecorator';
import { Residence, ResidenceLocationEntry } from '../../../shared/residences/residence.model';
import { ResidencesStore } from '../../../shared/residences/residences.store';
import { SidePanelService } from '../side-panel/side-panel.service';

interface MoveEdge {
  from: Residence;
  to: Residence;
}



@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent {
  private readonly residencesStore = inject(ResidencesStore);
  private readonly sidePanelService = inject(SidePanelService);
  private readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  private map: L.Map | null = null;
  private clusterGroup: L.MarkerClusterGroup | null = null;
  private markerData = new WeakMap<L.Marker, ResidenceLocationEntry>();
  private markerByResidenceId = new Map<string, L.Marker>();
  private moveLineGroup: L.LayerGroup | null = null;
  private currentEdges: MoveEdge[] = [];

  private readonly markerIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 22.3 12.5 41 12.5 41S25 22.3 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#22c55e" stroke="white" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="4.5" fill="white"/>
    </svg>`,
    className: '',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  private readonly clusterIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 22.3 12.5 41 12.5 41S25 22.3 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#3b82f6" stroke="white" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="4.5" fill="white"/>
    </svg>`,
    className: '',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  constructor() {
    afterNextRender(() => this.initMap());

    effect(() => {
      const residences = this.residencesStore.residences();
      if (!this.map) return;
      this.renderMarkers(residences);
    });
  }

  private initMap(): void {
    const el = this.mapContainer()?.nativeElement;
    if (!el) return;

    this.map = L.map(el, { zoomControl: false }).setView([50, 10], 5);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.clusterGroup = L.markerClusterGroup({
      zoomToBoundsOnClick: false,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: false,
      iconCreateFunction: () => this.clusterIcon,
    });
    this.clusterGroup.on('clusterclick', (e) => this.onClusterClick(e));
    this.clusterGroup.on('animationend', () => this.renderMoveLines());
    this.map.addLayer(this.clusterGroup);

    this.moveLineGroup = L.layerGroup().addTo(this.map);

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
    if (!this.clusterGroup) return;
    this.clusterGroup.clearLayers();
    this.markerData = new WeakMap();
    this.markerByResidenceId = new Map();

    const groups = this.groupResidences(residences);

    for (const group of groups) {
      const marker = L.marker([group.lat, group.lng], { icon: this.markerIcon });
      this.markerData.set(marker, group);

      for (const r of group.residences) {
        this.markerByResidenceId.set(r.id, marker);
      }

      marker.on('click', () => this.sidePanelService.open({ type: 'residence-location', locations: [group] }));

      this.clusterGroup.addLayer(marker);
    }

    this.currentEdges = this.computeMoveEdges(residences);
    this.renderMoveLines();
  }

  private computeMoveEdges(residences: Residence[]): MoveEdge[] {
    const byPerson = new Map<string, Residence[]>();
    for (const r of residences) {
      if (r.lat == null || r.lng == null) continue;
      const list = byPerson.get(r.personId) ?? [];
      list.push(r);
      byPerson.set(r.personId, list);
    }

    const edges: MoveEdge[] = [];
    for (const [, personResidences] of byPerson) {
      if (personResidences.length < 2) continue;
      if (personResidences.some(r => !r.startDate)) continue;

      personResidences.sort((a, b) => a.startDate!.date.localeCompare(b.startDate!.date));

      for (let i = 0; i < personResidences.length - 1; i++) {
        const from = personResidences[i];
        const to = personResidences[i + 1];
        if (from.lat === to.lat && from.lng === to.lng) continue;
        edges.push({ from, to });
      }
    }
    return edges;
  }

  private renderMoveLines(): void {
    if (!this.moveLineGroup || !this.clusterGroup) return;
    this.moveLineGroup.clearLayers();

    const drawn = new Set<string>();

    for (const edge of this.currentEdges) {
      const fromMarker = this.markerByResidenceId.get(edge.from.id);
      const toMarker = this.markerByResidenceId.get(edge.to.id);
      if (!fromMarker || !toMarker) continue;

      const fromVisible = this.clusterGroup.getVisibleParent(fromMarker);
      const toVisible = this.clusterGroup.getVisibleParent(toMarker);
      if (!fromVisible || !toVisible) continue;
      if (fromVisible === toVisible) continue;

      const fromLatLng = fromVisible.getLatLng();
      const toLatLng = toVisible.getLatLng();
      const dedupeKey = `${fromLatLng.lat},${fromLatLng.lng}->${toLatLng.lat},${toLatLng.lng}`;
      if (drawn.has(dedupeKey)) continue;
      drawn.add(dedupeKey);

      const line = L.polyline([fromLatLng, toLatLng], {
        color: '#6366f1',
        weight: 2,
        opacity: 0.6,
      });

      const decorator = L.polylineDecorator(line, {
        patterns: [{
          offset: '100%',
          repeat: 0,
          symbol: L.Symbol.arrowHead({
            pixelSize: 10,
            polygon: true,
            pathOptions: { color: '#6366f1', fillOpacity: 0.8, weight: 0 },
          }),
        }],
      });

      this.moveLineGroup.addLayer(line);
      this.moveLineGroup.addLayer(decorator);
    }
  }

  private onClusterClick(e: L.LeafletEvent): void {
    const cluster = e.layer as L.MarkerCluster;
    const childMarkers = cluster.getAllChildMarkers() as L.Marker[];

    const grouped = new Map<string, ResidenceLocationEntry>();
    for (const marker of childMarkers) {
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
