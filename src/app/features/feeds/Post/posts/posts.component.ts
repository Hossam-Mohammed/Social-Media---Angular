import {
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
  type AfterViewInit,
  type ElementRef,
  type OnInit,
  type WritableSignal,
} from '@angular/core';
import type { IPost } from '../../../../core/models/Posts/iposts.interface.js';
import { PostsService } from '../../../../core/services/Posts/posts.service.js';
import { AuthService } from '../../../../core/services/Auth/auth.service.js';
import type { Subscription } from 'rxjs';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Post } from '../../../../core/models/Feeds/ifeeds.interface.js';
import { CommentsComponent } from '../../../../shared/components/Comments/comments/comments.component.js';

@Component({
  selector: 'app-posts',
  imports: [NgTemplateOutlet, RouterLink, CommentsComponent],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.css',
})
export class PostsComponent implements OnInit, AfterViewInit {
  private _PostsService = inject(PostsService);
  private _AuthService = inject(AuthService);
  private _DestroyRef = inject(DestroyRef);
  private _Router = inject(Router);

  posts = signal<IPost[]>([]);
  calcDate = signal<number>(0);
  loading = signal(false); // first page (full skeleton)
  loadingMore = signal(false); // next pages (skeleton at the bottom)
  hasMore = signal(true);

  sentinel = viewChild.required<ElementRef<HTMLElement>>('sentinel');

  private page = 1;
  private sub?: Subscription;
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    // this.GetHomeFeed();
  }

  constructor() {
    effect(() => {
      this._PostsService.postType(); // reading the signal makes the effect re-run on every click
      untracked(() => this.reset());
      this.getPosts();
    });
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) this.loadMore();
      },
      { rootMargin: '400px' }, // start loading before the very bottom
    );
    this.observer.observe(this.sentinel().nativeElement);

    this._DestroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.sub?.unsubscribe();
    });
  }

  private reset() {
    this.sub?.unsubscribe(); // drop any in-flight request from the previous tab
    this.posts.set([]);
    this.page = 1;
    this.hasMore.set(true);
    this.loadingMore.set(false);
    this.fetch(1);
  }

  loadMore() {
    if (this.loading() || this.loadingMore() || !this.hasMore()) return;
    this.fetch(this.page + 1);
  }

  private fetch(page: number) {
    if (page === 1) this.loading.set(true);
    else this.loadingMore.set(true);

    this.sub = this._PostsService.GetPosts(page).subscribe({
      next: (res) => {
        const items: IPost[] =
          this._PostsService.postType() === 'saved' ? res.data.bookmarks : res.data.posts;
        const pagination = res.meta?.pagination;

        // skip posts we already have (new posts shift the pages and cause repeats)
        const seen = new Set(this.posts().map((p) => p._id));
        const fresh = items.filter((p) => !seen.has(p._id));

        this.posts.update((list) => [...list, ...fresh]);
        this.page = page;
        this.hasMore.set(
          fresh.length > 0 &&
            (pagination ? pagination.currentPage < pagination.numberOfPages : true),
        );

        this.loading.set(false);
        this.loadingMore.set(false);
        this.recheck();
      },
      error: (err) => {
        console.log(err);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }

  private recheck() {
    setTimeout(() => {
      const el = this.sentinel().nativeElement;
      this.observer?.unobserve(el);
      this.observer?.observe(el);
    });
  }

  getPosts() {
    this.loading.set(true);
    this._PostsService.GetPosts().subscribe({
      next: (res) => {
        console.log(res);
        if (this._PostsService.postType() === 'saved') {
          this.posts.set(res.data.bookmarks);
        } else {
          this.posts.set(res.data.posts);
        }
      },
      error: (err) => console.log(err),
    });
    this.loading.set(false);
  }

  // GetHomeFeed() {
  //   this._PostsService.GetHomeFeed().subscribe({
  //     next: (res) => {
  //       console.log(res);
  //       this.posts.set(res.data.posts);
  //     },
  //     error: (err) => {
  //       console.log(err);
  //     },
  //   });
  // }

  // getBookmarks() {
  //   this._AuthService.GetBookmarks().subscribe({
  //     next: (res) => {
  //       console.log(JSON.stringify(res.data.bookmarks));
  //     },
  //   });
  // }

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

  sharingId = signal<string | null>(null);

  sharePost(post: any, caption = ''): void {
    if (this.sharingId()) return; // block double clicks while a share is in flight

    this.sharingId.set(post._id);

    this._PostsService
      .SharePost(post._id, caption)
      .pipe(takeUntilDestroyed(this._DestroyRef))
      .subscribe({
        next: (res) => {
          const newPost = { ...res.data.post, bookmarked: false };

          this.posts.update((list) => {
            const updated = list.map((p) =>
              p._id === post._id ? { ...p, sharesCount: p.sharesCount + 1 } : p,
            );
            // only add to the list when viewing "my-posts", not the saved tab
            return this._PostsService.postType() === 'my-posts' ? [newPost, ...updated] : updated;
          });

          this.sharingId.set(null);
        },
        error: (err) => {
          console.log(err.error);
          this.sharingId.set(null);
        },
      });
  }

  currentUserId = this._PostsService.getUserId();

  openMenuId = signal<string | null>(null); // which post's menu is open
  editingId = signal<string | null>(null); // which post is in edit mode
  editText = signal('');
  busyId = signal<string | null>(null);

  isOwner(post: any): boolean {
    return post.user?._id === this.currentUserId;
  }

  toggleMenu(id: string): void {
    this.openMenuId.update((cur) => (cur === id ? null : id));
  }

  toggleBookmark(post: any): void {
    this.openMenuId.set(null);
    this._PostsService
      .ToggleBookmark(post._id)
      .pipe(takeUntilDestroyed(this._DestroyRef))
      .subscribe({
        next: (res) => {
          console.log(res); // check the response shape once

          if (this._PostsService.postType() === 'saved') {
            this.posts.update((list) => list.filter((p) => p._id !== post._id));
            return;
          }

          // prefer the server's value if the response has one, otherwise flip locally
          const saved = res?.data?.bookmarked ?? !post.bookmarked;
          this.posts.update((list) =>
            list.map((p) => (p._id === post._id ? { ...p, bookmarked: saved } : p)),
          );
        },
        error: (err) => console.log(err.status, err.error),
      });
  }
  startEdit(post: any): void {
    this.openMenuId.set(null);
    this.editText.set(post.body ?? '');
    this.editingId.set(post._id);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(post: any): void {
    const text = this.editText().trim();
    if (!text || this.busyId()) return; // API rejects an empty body

    this.busyId.set(post._id);
    this._PostsService
      .UpdatePost(post._id, text)
      .pipe(takeUntilDestroyed(this._DestroyRef))
      .subscribe({
        next: () => {
          this.posts.update((list) =>
            list.map((p) => (p._id === post._id ? { ...p, body: text } : p)),
          );
          this.editingId.set(null);
          this.busyId.set(null);
        },
        error: (err) => {
          console.log(err.error);
          this.busyId.set(null);
        },
      });
  }

  deletePost(post: any): void {
    this.openMenuId.set(null);
    if (!confirm('Delete this post?')) return;

    this._PostsService
      .DeletePost(post._id)
      .pipe(takeUntilDestroyed(this._DestroyRef))
      .subscribe({
        next: () => this.posts.update((list) => list.filter((p) => p._id !== post._id)),
        error: (err) => console.log(err.error),
      });
  }

  likingId = signal<string | null>(null);

  isLiked(post: any): boolean {
    return !!this.currentUserId && (post.likes ?? []).includes(this.currentUserId);
  }

  toggleLike(post: any): void {
    if (this.likingId() === post._id || !this.currentUserId) return; // block double clicks

    const wasLiked = this.isLiked(post);
    const userId = this.currentUserId;

    // update the screen immediately, undo it if the request fails
    this.applyLike(post._id, !wasLiked, userId);
    this.likingId.set(post._id);

    this._PostsService
      .ToggleLike(post._id)
      .pipe(takeUntilDestroyed(this._DestroyRef))
      .subscribe({
        next: (res) => {
          console.log(res); // check the response shape once
          this.likingId.set(null);
        },
        error: (err) => {
          console.log(err.status, err.error);
          this.applyLike(post._id, wasLiked, userId); // revert
          this.likingId.set(null);
        },
      });
  }

  private applyLike(postId: string, liked: boolean, userId: string): void {
    this.posts.update((list) =>
      list.map((p) => {
        if (p._id !== postId) return p;
        const likes = (p.likes ?? []).filter((id: string) => id !== userId);
        if (liked) likes.push(userId);
        return { ...p, likes, likesCount: likes.length };
      }),
    );
  }
}
