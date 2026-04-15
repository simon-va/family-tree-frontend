import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const userKeyInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('auth.tobit.com')) {
    return next(req);
  }

  const token = inject(AuthService).getUserToken();
  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq);
};
