import { afterNextRender, Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { Residence, ResidenceLocationEntry } from '../../../shared/residences/residence.model';
import { ResidencesStore } from '../../../shared/residences/residences.store';
import { SidePanelService } from '../side-panel/side-panel.service';



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
    this.map.addLayer(this.clusterGroup);
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

    const groups = this.groupResidences(residences);

    for (const group of groups) {
      const marker = L.marker([group.lat, group.lng], { icon: this.markerIcon });
      this.markerData.set(marker, group);

      marker.on('click', () => this.sidePanelService.open({ type: 'residence-location', locations: [group] }));

      this.clusterGroup.addLayer(marker);
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
