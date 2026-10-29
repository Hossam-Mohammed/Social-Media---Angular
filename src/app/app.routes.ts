import { Routes } from '@angular/router';
import { AuthlayoutComponent } from './layouts/authlayout/authlayout.component.js';
import { LoginComponent } from './features/login/login/login.component.js';
import { RegisterComponent } from './features/register/register/register.component.js';
import { MainlayoutComponent } from './layouts/mainlayout/mainlayout.component.js';
import { authGuard } from './core/guards/Auth/auth-guard.js';
import { authReverseGuard } from './core/guards/Auth/auth-reverse-guard.js';

export const routes: Routes = [
  // Default Route (Login)
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Auth Layout Routing (Login - Register)
  {
    path: '',
    component: AuthlayoutComponent,
    children: [
      // Login Children Routing
      { path: 'login', component: LoginComponent, title: 'TECHLink | Login' },
      // Register Children Routing
      { path: 'register', component: RegisterComponent, title: 'TECHLink | Register' },
    ],
    canActivate: [authReverseGuard],
  },

  // Main Layout Routing (Feeds - Profile - Notifications)
  {
    path: '',
    component: MainlayoutComponent,
    children: [
      // Feeds Children Routing
      {
        path: 'feeds',
        loadComponent: () =>
          import('./features/feeds/feeds/feeds.component.js').then((c) => c.FeedsComponent),
        title: 'TECHLink | Feeds',
      },
      {
        path: 'users/:id/profile',
        loadComponent: () =>
          import('./features/profile/UserProfile/user-profile/user-profile.component.js').then(
            (c) => c.UserProfileComponent,
          ),
        title: 'TECHLink | User Profile',
      },
      {
        path: 'posts/:id',
        loadComponent: () =>
          import('./features/feeds/Post/PostDetail/post-detail/post-detail.component.js').then(
            (c) => c.PostDetailComponent,
          ),
        title: 'TECHLink | User Profile',
      },
      // Profile Children Routing
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile/profile.component.js').then((c) => c.ProfileComponent),
        title: 'TECHLink | Profile',
      },
      // Notifications Children Routing
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications/notifications.component.js').then(
            (c) => c.NotificationsComponent,
          ),
        title: 'TECHLink | Notifications',
      },
      // Setting Children Routing
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/Settings/settings/settings.component.js').then(
            (c) => c.SettingsComponent,
          ),
        title: 'TECHLink | Settings',
      },
    ],
    canActivate: [authGuard],
  },

  // Wild Card Routing
  {
    path: '**',
    loadComponent: () =>
      import('./features/wildcard/wildcard/wildcard.component.js').then((c) => c.WildcardComponent),
    title: 'TECHLink | Page Not Found',
  },
];
