import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NotificationsService } from '../../../core/services/Notifications/notifications.service.js';
import { RouterLink } from '@angular/router';
// import { NotificationsService } from '...';   // your existing service

type Filter = 'all' | 'unread';
type CardKind = 'like' | 'comment' | 'share' | 'follow' | 'other';

interface ApiUser {
  _id: string;
  name: string;
  photo?: string;
  username?: string;
}

interface ApiNotification {
  _id: string;
  recipient: ApiUser;
  actor: ApiUser;
  type: string; // 'like_post' | 'comment_post' | 'share_post' | ...
  entityType: string; // 'post' | ...
  entityId: string;
  isRead: boolean;
  createdAt: string;
  entity?: {
    _id: string;
    body?: string;
    image?: string;
    topComment?: { content: string } | null;
  };
}

interface NotificationsResponse {
  success: boolean;
  message: string;
  data: { notifications: ApiNotification[] };
  meta?: {
    pagination?: { currentPage: number; limit: number; total: number; numberOfPages: number };
  };
}

interface NotificationCard {
  id: string;
  type: CardKind;
  actor: ApiUser;
  avatar: string;
  action: string;
  message: string;
  preview: string;
  time: string;
  read: boolean;
  postId: string;
}

// 'like_post' -> 'like', 'comment_post' -> 'comment', ...
function kindOf(type: string): CardKind {
  const t = type.toLowerCase();
  if (t.startsWith('like')) return 'like';
  if (t.startsWith('comment') || t.startsWith('reply')) return 'comment';
  if (t.startsWith('share')) return 'share';
  if (t.startsWith('follow')) return 'follow';
  return 'other';
}

const ACTIONS: Record<CardKind, string> = {
  like: 'liked your post',
  comment: 'commented on your post',
  share: 'shared your post',
  follow: 'started following you',
  other: 'sent you a notification',
};

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d` : new Date(iso).toLocaleDateString();
}

function toCard(n: ApiNotification): NotificationCard {
  const type = kindOf(n.type);
  return {
    id: n._id,
    type,
    actor: n.actor,
    avatar: n.actor?.photo ?? '',
    action: ACTIONS[type],
    message: ACTIONS[type],
    preview: n.entity?.body ?? '',
    time: timeAgo(n.createdAt),
    read: n.isRead,
    postId: n.entityId,
  };
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  templateUrl: './notifications.component.html',
  imports: [RouterLink],
})
export class NotificationsComponent implements OnInit {
  private _NotificationsService = inject(NotificationsService);

  notifications = signal<ApiNotification[]>([]);
  resMessage = '';
  loading = signal(true);
  filter = signal<Filter>('all');

  cards = computed(() => this.notifications().map(toCard));
  visibleCards = computed(() =>
    this.filter() === 'unread' ? this.cards().filter((c) => !c.read) : this.cards(),
  );
  unreadCount = computed(() => this.cards().filter((c) => !c.read).length);

  ngOnInit(): void {
    this.getNotifications();
  }

  getNotifications() {
    this._NotificationsService.getNotifications().subscribe({
      next: (res: NotificationsResponse) => {
        this.notifications.set(res.data.notifications);
        this.loading.set(false);
      },
      error: (err) => {
        this.resMessage = err.error?.message ?? 'Something went wrong';
        this.loading.set(false);
      },
    });
  }

  setFilter(f: Filter): void {
    this.filter.set(f);
  }

  markNotificationAsRead(notificationId: string) {
    this._NotificationsService.MarkNotificationAsRead(notificationId).subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n)),
        );
        this.getNotifications();
      },
      error: (err) => console.log(err),
    });
  }

  markAllAsRead() {
    this._NotificationsService.MarkAllAsRead().subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
        this.getNotifications();
      },
      error: (err) => console.log(err),
    });
  }
}
