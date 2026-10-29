import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal, type WritableSignal } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development.js';

// Interface matching your provided JSON structure
export interface PaginationMeta {
  currentPage: number;
  limit: number;
  total: number;
  numberOfPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private _HttpClient = inject(HttpClient);

  // Method maps your metadata straight to the URL query string
  getNotifications(unread: boolean = false, page: number = 1, limit: number = 10): Observable<any> {
    // 1. Get token from localStorage
    let params = new HttpParams().set('page', page).set('limit', limit);

    if (unread) {
      params = params.set('unread', true);
    }

    return this._HttpClient.get(`${environment.baseURL}/notifications`, { params });
  }

  GetNotificationsCount(): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/notifications`);
  }

  MarkNotificationAsRead(notificationID?: string): Observable<any> {
    return this._HttpClient.patch(
      `${environment.baseURL}/notifications/${notificationID}/read`,
      {},
    );
  }

  MarkAllAsRead(): Observable<any> {
    return this._HttpClient.patch(`${environment.baseURL}/notifications/read-all`, {});
  }
}
