import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './core/interceptors/Token/token-interceptor.js';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ), //Routes for import routing. | View Transition for make the transition while routing smooth. | Memory scrolling to make a view back to top while routing'enable'||also with backward and forward buttons'top' || disable.
    provideHttpClient(withFetch(), withInterceptors([tokenInterceptor])), //To import HTTP clients to deal with APIs.
  ],
};
