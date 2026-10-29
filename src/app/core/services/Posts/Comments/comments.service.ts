import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '../../../../../environments/environment.development.js';

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  private _HttpClient = inject(HttpClient);

  GetPostComments(postId: string): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/posts/${postId}/comments`).pipe(
      catchError(() => this._HttpClient.get(`${environment.baseURL}/posts/${postId}`)),
    );
  }

  CreateComment(postId: string, data: FormData | { content: string }): Observable<any> {
    return this._HttpClient.post(`${environment.baseURL}/posts/${postId}/comments`, data);
  }

  GetCommentReplies(postId: string, commentId: string): Observable<any> {
    return this._HttpClient.get(`${environment.baseURL}/posts/${postId}/comments/${commentId}`);
  }

  CreateReply(postId: string, commentId: string, data: FormData | { content: string }): Observable<any> {
    return this._HttpClient.post(
      `${environment.baseURL}/posts/${postId}/comments/${commentId}/replies`,
      data,
    );
  }

  UpdateComment(postId: string, commentId: string, data: FormData | { content: string }): Observable<any> {
    return this._HttpClient.put(
      `${environment.baseURL}/posts/${postId}/comments/${commentId}`,
      data,
    );
  }

  DeleteComment(postId: string, commentId: string): Observable<any> {
    return this._HttpClient.delete(`${environment.baseURL}/posts/${postId}/comments/${commentId}`);
  }

  LikeUnlikeComment(postId: string, commentId: string): Observable<any> {
    return this._HttpClient.put(
      `${environment.baseURL}/posts/${postId}/comments/${commentId}/like`,
      {},
    );
  }
}
