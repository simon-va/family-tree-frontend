import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeyService } from '../auth/key.service';

export const authGuard: CanActivateFn = () => {
  const keyService = inject(KeyService);
  const router = inject(Router);

  if (keyService.getKey()) {
    return true;
  }

  return router.parseUrl('/');
};
