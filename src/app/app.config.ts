import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { userKeyInterceptor } from './core/interceptors/user-key.interceptor';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    MessageService,
    ConfirmationService,
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([userKeyInterceptor])),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      const refreshToken = authService.getRefreshToken();
      if (!refreshToken) return;
      return firstValueFrom(authService.fetchUserToken(refreshToken))
        .then((token) => authService.setUserToken(token))
        .catch(() => authService.clearAuth());
    }),
    providePrimeNG({
      theme: {
          preset: Aura,
          options: {
            darkModeSelector: false || 'none'
          }
      }
    })
  ]
};
