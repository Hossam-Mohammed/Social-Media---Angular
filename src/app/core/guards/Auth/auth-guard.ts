import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  // Inject Router Service to force navigate the user to go to login page.
  const _Router = inject(Router);
  // Creating token variable to check if user logged or not.
  const token = localStorage.getItem('token');

  // This if condition work for check if this token is null (falsy value: the user not login) or have a value so the user is login successfully.
  if (token) {
    // If true it will be true and navigate to the service user want by routerLink for ex.
    return true;
  } else {
    // If false it will be force navigate by parseURL to avoid un login users to use its service.
    return _Router.parseUrl('/login');
  }
};
