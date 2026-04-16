import { Component, computed, ElementRef, input, model, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import * as L from 'leaflet';

// Fix default marker icon path issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface MapSelectionResult {
  lat: number;
  lng: number;
  street?: string;
  city?: string;
  country?: string;
}

@Component({
  selector: 'app-residence-map-dialog',
  standalone: true,
  imports: [Dialog, ButtonModule, InputTextModule, FormsModule],
  templateUrl: './residence-map-dialog.component.html',
  styleUrl: './residence-map-dialog.component.scss',
})
export class ResidenceMapDialogComponent {
  readonly visible = model<boolean>(false);
  readonly initialCoords = input<{ lat: number; lng: number } | null>(null);
  readonly coordsSelected = output<MapSelectionResult>();

  readonly searchQuery = signal('');
  readonly markerCoords = signal<{ lat: number; lng: number } | null>(null);
  readonly addressData = signal<{ street?: string; city?: string; country?: string } | null>(null);
  readonly canSave = computed(() => this.markerCoords() !== null);

  readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  private map: L.Map | null = null;
  private currentMarker: L.Marker | null = null;

  onDialogShow(): void {
    setTimeout(() => {
      const el = this.mapContainer()?.nativeElement;
      if (!el) return;

      if (!this.map) {
        this.map = L.map(el).setView([50, 10], 4);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd',
        }).addTo(this.map);
        this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));
      }

      this.map.invalidateSize();
      this.clearMarker();
      this.searchQuery.set('');

      const coords = this.initialCoords();
      if (coords) {
        this.setMarker(coords.lat, coords.lng);
        this.map.setView([coords.lat, coords.lng], 14);
      }
    }, 100);
  }

  onDialogHide(): void {
    this.clearMarker();
    this.searchQuery.set('');
    this.visible.set(false);
  }

  onMapClick(e: L.LeafletMouseEvent): void {
    this.setMarker(e.latlng.lat, e.latlng.lng);
    this.addressData.set(null);
  }

  onSearch(): void {
    const query = this.searchQuery().trim();
    if (!query || !this.map) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((results: any[]) => {
        if (results?.length > 0) {
          const result = results[0];
          const numLat = parseFloat(result.lat);
          const numLng = parseFloat(result.lon);
          this.setMarker(numLat, numLng);
          this.map!.setView([numLat, numLng], 14);

          const addr = result.address;
          if (addr) {
            const road = addr.road ?? '';
            const houseNumber = addr.house_number ?? '';
            const street = [road, houseNumber].filter(Boolean).join(' ') || undefined;
            const cityName = addr.city ?? addr.town ?? addr.village ?? addr.municipality;
            const city = [addr.postcode, cityName].filter(Boolean).join(' ') || undefined;
            const country = addr.country ?? undefined;
            this.addressData.set({ street, city, country });
          } else {
            this.addressData.set(null);
          }
        }
      });
  }

  onSave(): void {
    const coords = this.markerCoords();
    if (!coords) return;

    const address = this.addressData();
    this.coordsSelected.emit({ ...coords, ...address });
    this.visible.set(false);
    this.clearMarker();
  }

  onCancel(): void {
    this.visible.set(false);
    this.clearMarker();
  }

  private setMarker(lat: number, lng: number): void {
    if (this.currentMarker && this.map) {
      this.map.removeLayer(this.currentMarker);
    }
    if (this.map) {
      this.currentMarker = L.marker([lat, lng]).addTo(this.map);
    }
    this.markerCoords.set({ lat, lng });
  }

  private clearMarker(): void {
    if (this.currentMarker && this.map) {
      this.map.removeLayer(this.currentMarker);
      this.currentMarker = null;
    }
    this.markerCoords.set(null);
    this.addressData.set(null);
  }
}
