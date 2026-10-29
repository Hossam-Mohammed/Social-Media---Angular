import {
  Component,
  DestroyRef,
  inject,
  input,
  type OnInit,
  signal,
  type WritableSignal,
} from '@angular/core';
import { CommentsService } from '../../../../core/services/Posts/Comments/comments.service.js';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.css',
})
export class CommentsComponent implements OnInit {
  private _CommentsService = inject(CommentsService);
  private _DestroyRef = inject(DestroyRef);

  postId = input<string | undefined>('');
  topComment = input<any>(null);
  commentsCount = input<number>(0);
  autoLoad = input<boolean>(false);

  allComments: WritableSignal<any[]> = signal([]);
  loading: WritableSignal<boolean> = signal(false);
  showAllComments: WritableSignal<boolean> = signal(false);
  newCommentText: WritableSignal<string> = signal('');
  isSubmitting: WritableSignal<boolean> = signal(false);
  currentUserId: WritableSignal<string | null> = signal(null);
  currentUserPhoto: WritableSignal<string> = signal('./Images/default-profile.png');

  ngOnInit(): void {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') ?? '{}');
      this.currentUserId.set(userInfo._id ?? null);
      if (userInfo.photo) {
        this.currentUserPhoto.set(userInfo.photo);
      }
    } catch {
      this.currentUserPhoto.set('./Images/default-profile.png');
    }

    if (this.autoLoad()) {
      this.showAllComments.set(true);
      this.getComments();
    }
  }

  toggleComments(): void {
    const next = !this.showAllComments();
    this.showAllComments.set(next);
    if (next && this.allComments().length === 0) {
      this.getComments();
    }
  }

  getComments(id?: string): void {
    const targetId = id || this.postId();
    if (!targetId) return;
    this.loading.set(true);
    this._CommentsService
      .GetPostComments(targetId)
      .pipe(takeUntilDestroyed(this._DestroyRef))
      .subscribe({
        next: (res) => {
          const list = this.extractComments(res);
          this.allComments.set(list);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading comments:', err);
          this.loading.set(false);
        },
      });
  }

  private extractComments(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res.comments)) return res.comments;
    if (Array.isArray(res.data?.comments)) return res.data.comments;
    if (Array.isArray(res.data?.post?.comments)) return res.data.post.comments;
    if (Array.isArray(res.data)) return res.data;
    if (res.data?.post?.topComment) return [res.data.post.topComment];
    if (res.topComment) return [res.topComment];
    return [];
  }

  addComment(): void {
    const text = this.newCommentText().trim();
    const pid = this.postId();
    if (!text || this.isSubmitting() || !pid) return;

    this.isSubmitting.set(true);
    const formData = new FormData();
    formData.append('content', text);

    this._CommentsService
      .CreateComment(pid, formData)
      .pipe(takeUntilDestroyed(this._DestroyRef))
      .subscribe({
        next: (res) => {
          const newComment = res.data?.comment || res.comment || {
            _id: 'local-' + Date.now(),
            content: text,
            createdAt: new Date().toISOString(),
            commentCreator: {
              _id: this.currentUserId(),
              name: 'You',
              photo: this.currentUserPhoto(),
            },
          };
          this.allComments.update((list) => [newComment, ...list]);
          this.newCommentText.set('');
          this.isSubmitting.set(false);
        },
        error: (err) => {
          console.error('Failed to create comment:', err);
          this.isSubmitting.set(false);
        },
      });
  }

  deleteComment(commentId: string): void {
    const pid = this.postId();
    if (!pid || !confirm('Are you sure you want to delete this comment?')) return;
    this._CommentsService
      .DeleteComment(pid, commentId)
      .pipe(takeUntilDestroyed(this._DestroyRef))
      .subscribe({
        next: () => {
          this.allComments.update((list) => list.filter((c) => c._id !== commentId));
        },
        error: (err) => console.error('Failed to delete comment:', err),
      });
  }

  likeComment(comment: any): void {
    const pid = this.postId();
    if (!pid) return;
    this._CommentsService
      .LikeUnlikeComment(pid, comment._id)
      .pipe(takeUntilDestroyed(this._DestroyRef))
      .subscribe({
        next: () => {
          // toggle local reaction if applicable
        },
        error: (err) => console.error('Failed to like comment:', err),
      });
  }

  isOwner(comment: any): boolean {
    const creatorId =
      comment.commentCreator?._id ||
      (typeof comment.commentCreator === 'string' ? comment.commentCreator : null);
    return !!creatorId && creatorId === this.currentUserId();
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = './Images/default-profile.png';
  }

  getTimeAgo(createdAt: string): string {
    if (!createdAt) return '';
    const now = new Date().getTime();
    const time = new Date(createdAt).getTime();
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d`;
    return `${Math.floor(diffInDays / 30)}mo`;
  }
}
