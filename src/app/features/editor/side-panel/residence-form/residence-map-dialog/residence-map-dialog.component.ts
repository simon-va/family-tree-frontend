import { Component, computed, ElementRef, input, model, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

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

  private map: google.maps.Map | null = null;
  private currentMarker: google.maps.marker.AdvancedMarkerElement | null = null;
  private geocoder: google.maps.Geocoder | null = null;

  onDialogShow(): void {
    setTimeout(() => {
      const el = this.mapContainer()?.nativeElement;
      if (!el) return;

      if (!this.map) {
        this.map = new google.maps.Map(el, {
          center: { lat: 50, lng: 10 },
          zoom: 4,
          mapId: 'b513a364f3220e049a6f54a0',
          zoomControlOptions: { position: google.maps.ControlPosition.BOTTOM_RIGHT },
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        this.geocoder = new google.maps.Geocoder();
        this.map.addListener('click', (e: google.maps.MapMouseEvent) => this.onMapClick(e));
      }

      this.clearMarker();
      this.searchQuery.set('');

      const coords = this.initialCoords();
      if (coords) {
        this.setMarker(coords.lat, coords.lng);
        this.map.setCenter(coords);
        this.map.setZoom(14);
      }
    }, 100);
  }

  onDialogHide(): void {
    this.clearMarker();
    this.searchQuery.set('');
    this.visible.set(false);
  }

  onMapClick(e: google.maps.MapMouseEvent): void {
    if (!e.latLng) return;
    this.setMarker(e.latLng.lat(), e.latLng.lng());
    this.addressData.set(null);
  }

  onSearch(): void {
    const query = this.searchQuery().trim();
    if (!query || !this.geocoder || !this.map) return;

    this.geocoder.geocode({ address: query }, (results, status) => {
      if (status !== 'OK' || !results?.length) return;
      const result = results[0];
      const lat = result.geometry.location.lat();
      const lng = result.geometry.location.lng();
      this.setMarker(lat, lng);
      this.map!.setCenter({ lat, lng });
      this.map!.setZoom(14);

      const get = (type: string) =>
        result.address_components.find(c => c.types.includes(type))?.long_name ?? '';
      const street = [get('route'), get('street_number')].filter(Boolean).join(' ') || undefined;
      const cityName = get('locality') || get('sublocality') || get('administrative_area_level_1');
      const city = [get('postal_code'), cityName].filter(Boolean).join(' ') || undefined;
      const country = get('country') || undefined;
      this.addressData.set({ street, city, country });
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
    if (this.currentMarker) this.currentMarker.map = null;
    this.currentMarker = new google.maps.marker.AdvancedMarkerElement({
      position: { lat, lng },
      map: this.map!,
    });
    this.markerCoords.set({ lat, lng });
  }

  private clearMarker(): void {
    if (this.currentMarker) {
      this.currentMarker.map = null;
      this.currentMarker = null;
    }
    this.markerCoords.set(null);
    this.addressData.set(null);
  }
}
