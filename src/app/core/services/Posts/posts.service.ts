import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, forkJoin, map, type Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development.js';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  private _HttpClient = inject(HttpClient);
  private _Router = inject(Router);

  postType = signal<string>('feed');

  selectPostType(type: string) {
    this.postType.set(type);
  }

  GetPosts(page = 1, limit = 20): Observable<any> {
    const type = this.postType();
    const params = new HttpParams().set('page', page).set('limit', limit);

    if (type === 'feed') {
      console.log(type);
      return this._HttpClient.get(`${environment.baseURL}/posts/feed`, { params });
    } else if (type === 'my-posts') {
      console.log(type);
      return this._HttpClient.get(`${environment.baseURL}//users/${this.getUserId()}/posts`, {
        params,
      }); // check your API docs
    } else if (type === 'saved') {
      console.log(type);
      return this._HttpClient.get(`${environment.baseURL}/users/bookmarks`, { params }); // check your API docs
    } else {
      console.log(type);
      return this._HttpClient.get(`${environment.baseURL}/posts`, { params });
    }
  }

  // GetAllPosts(): Observable<any> {}

  // GetHomeFeed(): Observable<any> {}

  CreatePost(data: FormData): Observable<any> {
    return this._HttpClient.post(`${environment.baseURL}/posts`, data);
  }

  SharePost(postId: string, body = ''): Observable<any> {
    return this._HttpClient.post(`${environment.baseURL}/posts/${postId}/share`, {
      body: body.trim() || 'Shared a post',
    });
  }

  getUserId(): string | null {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') ?? '{}');
    return userInfo._id ?? null;
  }

  ToggleBookmark(postId: string): Observable<any> {
    return this._HttpClient.put(`${environment.baseURL}/posts/${postId}/bookmark`, {});
  }

  UpdatePost(postId: string, body: string): Observable<any> {
    return this._HttpClient.put(`${environment.baseURL}/posts/${postId}`, { body });
  }

  DeletePost(postId: string): Observable<any> {
    return this._HttpClient.delete(`${environment.baseURL}/posts/${postId}`);
  }

  ToggleLike(postId: string): Observable<any> {
    return this._HttpClient.put(`${environment.baseURL}/posts/${postId}/like`, {});
  }

  // Fetch a single post by its ID (GET /posts/:id)
  getPostById(postId: string): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/posts/${postId}`);
  }
}
