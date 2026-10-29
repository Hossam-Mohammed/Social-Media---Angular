import { Component, DestroyRef, inject, signal, type Signal } from '@angular/core';
import { AuthService } from '../../../../core/services/Auth/auth.service.js';
import { PostsService } from '../../../../core/services/Posts/posts.service.js';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, type Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommentsComponent } from '../../../../shared/components/Comments/comments/comments.component.js';

@Component({
  selector: 'app-user-profile',
  imports: [RouterLink, CommentsComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent {
  private readonly _AuthService = inject(AuthService);
  private readonly _PostsService = inject(PostsService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);

  user = signal<any | null>(null);
  isFollowing = signal(false);
  posts = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  userID = signal<string>('');
  currentUserId = this._PostsService.getUserId();
  likingId = signal<string | null>(null);
  sharingId = signal<string | null>(null);

  isLiked(post: any): boolean {
    return !!this.currentUserId && (post.likes ?? []).includes(this.currentUserId);
  }

  toggleLike(post: any): void {
    if (this.likingId() === post._id || !this.currentUserId) return;
    const wasLiked = this.isLiked(post);
    const userId = this.currentUserId;

    this.posts.update((list) =>
      list.map((p) => {
        if (p._id !== post._id) return p;
        const likes = (p.likes ?? []).filter((id: string) => id !== userId);
        if (!wasLiked) likes.push(userId);
        return { ...p, likes, likesCount: likes.length };
      }),
    );
    this.likingId.set(post._id);

    this._PostsService
      .ToggleLike(post._id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => this.likingId.set(null),
        error: () => {
          this.posts.update((list) =>
            list.map((p) => {
              if (p._id !== post._id) return p;
              const likes = (p.likes ?? []).filter((id: string) => id !== userId);
              if (wasLiked) likes.push(userId);
              return { ...p, likes, likesCount: likes.length };
            }),
          );
          this.likingId.set(null);
        },
      });
  }

  sharePost(post: any, caption = ''): void {
    if (this.sharingId()) return;
    this.sharingId.set(post._id);
    this._PostsService
      .SharePost(post._id, caption)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.posts.update((list) =>
            list.map((p) => (p._id === post._id ? { ...p, sharesCount: p.sharesCount + 1 } : p)),
          );
          this.sharingId.set(null);
        },
        error: () => this.sharingId.set(null),
      });
  }

  constructor() {
    // re-load if the :id param changes while the component stays mounted
    this._route.paramMap.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadProfile(id);
        this.userID.set(id);
      }
    });
    this.followUser(this.userID());
  }

  private loadProfile(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      profile: this._AuthService.GetUserProfile(id),
      posts: this._AuthService.GetUserPosts(id),
    })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: ({ profile, posts }) => {
          this.user.set(profile.data.user);
          this.isFollowing.set(profile.data.isFollowing);
          this.posts.set(posts.data.posts);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Could not load this profile. Please try again.');
          this.loading.set(false);
        },
      });
  }

  trackPost(_: number, post: any) {
    return post._id;
  }

  getTimeAgo(createdAt: string): string {
    const now = new Date().getTime();
    const postTime = new Date(createdAt).getTime();
    const diffInSeconds = Math.floor((now - postTime) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays}d ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  }

  followUser(userId: string): any {
    this._AuthService.FollowUser(userId).subscribe({
      next: (res) => {
        console.log('Follow Success' + res);
        this.loadProfile(userId);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
}
