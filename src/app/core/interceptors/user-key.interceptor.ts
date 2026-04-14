import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { KeyService } from '../auth/key.service';

export const userKeyInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/user-key')) {
    return next(req);
  }

  const key = inject(KeyService).getKey();
  if (!key) {
    return next(req);
  }

  const authReq = req.clone({
    params: req.params.set('userKey', key),
  });

  return next(authReq);
};
