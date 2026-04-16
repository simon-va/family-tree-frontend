import { afterNextRender, Component, computed, effect, ElementRef, inject, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { Residence } from '../../../shared/residences/residence.model';
import { ResidencesStore } from '../../../shared/residences/residences.store';
import { SidePanelService } from '../side-panel/side-panel.service';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface GroupedResidence {
  lat: number;
  lng: number;
  residences: Residence[];
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
  private markerLayer: L.LayerGroup | null = null;

  readonly groupedResidences = computed<GroupedResidence[]>(() => {
    const residences = this.residencesStore.residences();
    const grouped = new Map<string, GroupedResidence>();

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
  });

  constructor() {
    afterNextRender(() => this.initMap());

    effect(() => {
      const groups = this.groupedResidences();
      if (!this.map) return;
      this.renderMarkers(groups);
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

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.renderMarkers(this.groupedResidences());
  }

  private renderMarkers(groups: GroupedResidence[]): void {
    if (!this.markerLayer) return;
    this.markerLayer.clearLayers();

    for (const group of groups) {
      const marker = L.marker([group.lat, group.lng]);

      const lines = group.residences.map((r) => {
        const parts = [r.street, r.city, r.country].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Unbekannter Ort';
      });
      marker.bindPopup(lines.join('<br>'));

      const uniquePersonIds = new Set(group.residences.map((r) => r.personId));
      if (uniquePersonIds.size === 1) {
        const personId = uniquePersonIds.values().next().value!;
        const residenceId = group.residences[0].id;
        marker.on('click', () => this.sidePanelService.open({ type: 'person-detail', personId, residenceId }));
      }

      this.markerLayer.addLayer(marker);
    }
  }
}
