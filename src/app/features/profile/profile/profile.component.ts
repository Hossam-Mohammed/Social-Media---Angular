import {
  Component,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
  viewChild,
  WritableSignal,
  type ElementRef,
} from '@angular/core';
import { AuthService } from '../../../core/services/Auth/auth.service.js';
import type { IUser } from '../../../core/models/User/iuser.interface.js';
import { PostsService } from '../../../core/services/Posts/posts.service.js';
import type { IPost } from '../../../core/models/Posts/iposts.interface.js';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommentsComponent } from '../../../shared/components/Comments/comments/comments.component.js';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, CommentsComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private _AuthService = inject(AuthService);
  protected _PostsService = inject(PostsService);
  private readonly _destroyRef = inject(DestroyRef);
  private _router = inject(Router);

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  resMessage: string = '';
  // Fixed: Initialized with null and allowed IUser | null type
  userData: WritableSignal<IUser | null> = signal<IUser | null>(null);
  bookmarksTotal: WritableSignal<number> = signal<number>(0);
  postsTotal: WritableSignal<number> = signal<number>(0);
  userImage: WritableSignal<string> = signal('');
  userName: WritableSignal<string> = signal('');
  posts = signal<IPost[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.getMyProfile();
    this.getUserImg();
    this.getBookmarks();
    this._PostsService.postType.set('my-posts');
  }

  constructor() {
    effect(() => {
      this._PostsService.postType(); // reading the signal makes the effect re-run on every click
      this.getPosts();
    });
  }

  getPosts() {
    this.loading.set(true);
    this._PostsService.GetPosts().subscribe({
      next: (res) => {
        console.log(res);
        if (this._PostsService.postType() === 'saved') {
          this.posts.set(res.data.bookmarks);
          this.postsTotal.set(res.meta.pagination.total);
        } else {
          this.posts.set(res.data.posts);
          this.postsTotal.set(res.meta.pagination.total);
        }
      },
      error: (err) => console.log(err),
    });
    this.loading.set(false);
  }

  getUserImg() {
    this._AuthService.GetMyProfile().subscribe({
      next: (res) => {
        this.userImage.set(res.data.user.photo);
        this.userName.set(res.data.user.name);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  getMyProfile() {
    this._AuthService.GetMyProfile().subscribe({
      next: (res) => {
        this.userData.set(res.data.user);
      },
      error: (err) => {
        console.log(err);
        this.resMessage = err.error.message;
      },
    });
  }

  getBookmarks() {
    this._AuthService.GetBookmarks().subscribe({
      next: (res) => {
        console.log(JSON.stringify(res.data.bookmarks));
        this.bookmarksTotal.set(res.meta.pagination.total);
      },
    });
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

  isUploading = signal(false);
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

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;
    if (file.size > 4 * 1024 * 1024) return;

    this.isUploading.set(true);

    this._AuthService
      .UploadPhoto(file)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (res) => {
          console.log(res); // check the response shape once
          this.getMyProfile();
          this.getUserImg();
          this.getBookmarks();
          this.getPosts(); // <- replace with your existing method that loads the profile
          this.isUploading.set(false);
        },
        error: () => this.isUploading.set(false),
      });

    input.value = '';
  }
}
