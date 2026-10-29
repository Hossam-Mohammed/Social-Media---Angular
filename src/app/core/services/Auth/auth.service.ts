import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development.js';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _HttpClient = inject(HttpClient);
  private _Router = inject(Router);

  SignOut() {
    this._Router.navigate(['/login']);
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  }

  SignUp(formData: object): Observable<any> {
    return this._HttpClient.post(`${environment.baseURL}/users/signup`, formData);
  }

  SignIn(formData: object): Observable<any> {
    return this._HttpClient.post(`${environment.baseURL}/users/signin`, formData);
  }

  ChangePassword(formData: object): Observable<any> {
    return this._HttpClient.patch(`${environment.baseURL}/users/change-password`, formData);
  }

  GetMyProfile(): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/users/profile-data`);
  }

  GetFollowSuggestions(): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/users/suggestions`);
  }

  GetBookmarks(): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/users/bookmarks`);
  }

  FollowUser(userId: string): Observable<any> {
    return this._HttpClient.put(`${environment.baseURL}/users/${userId}/follow`, {});
  }

  GetUserProfile(userId: string): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/users/${userId}/profile`);
  }

  GetUserPosts(userId: string): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/users/${userId}/posts`);
  }

  UploadPhoto(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('photo', file); // key must match the one in Postman

    return this._HttpClient.put(`${environment.baseURL}/users/upload-photo`, formData);
  }
}
