import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import type { Post } from '../../../../../core/models/Feeds/ifeeds.interface.js';
import { PostsService } from '../../../../../core/services/Posts/posts.service.js';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommentsComponent } from '../../../../../shared/components/Comments/comments/comments.component.js';

@Component({
  selector: 'app-post-detail',
  imports: [RouterLink, CommentsComponent],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.css',
})
export class PostDetailComponent {
  private route = inject(ActivatedRoute);
  private postsService = inject(PostsService);

  // --- Signals State ---
  post = signal<Post | null>(null);
  loading = signal<boolean>(true);

  // Interaction & UI states
  openMenuId = signal<string | null>(null);
  editingId = signal<string | null>(null);
  editText = signal<string>('');

  busyId = signal<string | null>(null);
  likingId = signal<boolean>(false);
  sharingId = signal<boolean>(false);

  currentUserId = this.postsService.getUserId() || '6ad76a04fbc846000bb23fa3';

  ngOnInit(): void {
    // Get the post ID from route parameters (e.g., /posts/:id)
    const postId = this.route.snapshot.paramMap.get('id');
    if (postId) {
      this.loadPost(postId);
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.postsService.getPostById(id).subscribe({
          next: (data) => this.post.set(data),
          error: (err) => console.error('Failed to load post', err),
        });
      }
    }
  }

  // Load single post data from API
  loadPost(postId: string): void {
    this.loading.set(true);
    this.postsService.getPostById(postId).subscribe({
      next: (res) => {
        // Based on your JSON response structure: data.post
        this.post.set(res.data.post);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load post', err);
        this.loading.set(false);
      },
    });
  }

  // Toggle the options dropdown menu (...)
  toggleMenu(postId: string): void {
    this.openMenuId.update((id) => (id === postId ? null : postId));
  }

  // Check if current user is the owner of the post
  isOwner(item: Post): boolean {
    return item.user._id === this.currentUserId;
  }

  // Check if the current user has liked the post
  isLiked(item: Post): boolean {
    return item.likes?.includes(this.currentUserId);
  }

  // Toggle Bookmark / Save post
  toggleBookmark(item: Post): void {
    item.bookmarked = !item.bookmarked;
    this.openMenuId.set(null);
    this.postsService.ToggleBookmark(item._id).subscribe({
      error: () => {
        item.bookmarked = !item.bookmarked;
      }, // Rollback on error
    });
  }

  // Toggle Like API & local state update
  toggleLike(item: Post): void {
    if (this.likingId()) return;
    this.likingId.set(true);

    this.postsService.ToggleLike(item._id).subscribe({
      next: () => {
        if (this.isLiked(item)) {
          item.likes = item.likes.filter((id) => id !== this.currentUserId);
          item.likesCount--;
        } else {
          item.likes.push(this.currentUserId);
          item.likesCount++;
        }
        this.likingId.set(false);
      },
      error: () => {
        this.likingId.set(false);
      },
    });
  }

  // Share Post API & local state update
  sharePost(item: Post): void {
    if (this.sharingId()) return;
    this.sharingId.set(true);

    this.postsService.SharePost(item._id).subscribe({
      next: () => {
        item.sharesCount++;
        this.sharingId.set(false);
      },
      error: () => {
        this.sharingId.set(false);
      },
    });
  }

  // Edit actions
  startEdit(item: Post): void {
    this.editingId.set(item._id);
    this.editText.set(item.body || '');
    this.openMenuId.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editText.set('');
  }

  saveEdit(item: Post): void {
    if (!this.editText().trim()) return;
    this.busyId.set(item._id);

    this.postsService.UpdatePost(item._id, this.editText()).subscribe({
      next: () => {
        item.body = this.editText();
        this.busyId.set(null);
        this.editingId.set(null);
        this.editText.set('');
      },
      error: () => {
        this.busyId.set(null);
      },
    });
  }

  deletePost(item: Post): void {
    this.postsService.DeletePost(item._id).subscribe({
      next: () => {
        this.post.set(null); // Clear or navigate away
      },
    });
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }
}
