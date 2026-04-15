import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

const API_BASE = 'https://run.chayns.codes/dd996dd6';

@Component({
  selector: 'app-welcome',
  imports: [ButtonModule, InputTextModule, PasswordModule, FormsModule, ConfirmDialogModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
  providers: [ConfirmationService],
})
export class WelcomeComponent {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly storedUser = signal(this.authService.getProfile());
  readonly userName = signal('');
  readonly password = signal('');
  readonly loading = signal(false);

  goToEditor(): void {
    this.router.navigate(['/editor']);
  }

  login(): void {
    const username = this.userName().trim();
    const pwd = this.password().trim();
    if (!username || !pwd) return;

    this.loading.set(true);

    this.authService
      .fetchRefreshToken(username, pwd)
      .pipe(
        switchMap((refreshToken) => {
          this.authService.setRefreshToken(refreshToken);
          return this.authService.fetchUserToken(refreshToken);
        }),
        switchMap((userToken) => {
          this.authService.setUserToken(userToken);
          return this.http.get<{ id: string; firstName: string; lastName: string }>(
            `${API_BASE}/auth/login`,
          );
        }),
      )
      .subscribe({
        next: (user) => {
          this.authService.setProfile(user.firstName, user.lastName);
          this.router.navigate(['/editor']);
        },
        error: (err) => {
          this.loading.set(false);
          if (err?.status === 404) {
            this.promptRegister();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Fehler',
              detail: 'Login fehlgeschlagen. Bitte überprüfe deine Eingaben.',
            });
          }
        },
      });
  }

  private promptRegister(): void {
    this.confirmationService.confirm({
      header: 'Neuer Nutzer',
      message: 'Du bist noch nicht registriert. Möchtest du ein Konto erstellen?',
      acceptLabel: 'Registrieren',
      rejectLabel: 'Abbrechen',
      accept: () => this.register(),
    });
  }

  private register(): void {
    this.http
      .post<{ id: string; firstName: string; lastName: string }>(`${API_BASE}/auth/register`, {})
      .subscribe({
        next: (user) => {
          this.authService.setProfile(user.firstName, user.lastName);
          this.router.navigate(['/editor']);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Registrierung fehlgeschlagen. Bitte versuche es später erneut.',
          });
        },
      });
  }
}

