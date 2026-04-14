import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { KeyService } from '../../core/auth/key.service';

@Component({
  selector: 'app-welcome',
  imports: [ButtonModule, InputTextModule, FormsModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class WelcomeComponent {
  private readonly http = inject(HttpClient);
  private readonly keyService = inject(KeyService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly storedUser = signal(this.keyService.getProfile());
  readonly mode = signal<'name' | 'key'>('name');
  readonly inputValue = signal('');

  switchToKeyMode(): void {
    this.inputValue.set('');
    this.mode.set('key');
  }

  goToEditor(): void {
    if (this.storedUser()) {
      this.router.navigate(['/editor']);
      return;
    }

    const value = this.inputValue().trim();
    if (!value) return;

    if (this.mode() === 'key') {
      this.keyService.setKey(value);
      this.router.navigate(['/editor']);
      return;
    }

    this.http
      .post<{ id: string }>('https://run.chayns.codes/dd996dd6/auth/user-key', { userName: value })
      .subscribe({
        next: (response) => {
          this.keyService.setProfile(value, response.id);
          this.router.navigate(['/editor']);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Zurzeit können keine neuen Nutzer erstellt werden. Bitte versuche es später erneut.',
          });
          this.switchToKeyMode();
        },
      });
  }
}
