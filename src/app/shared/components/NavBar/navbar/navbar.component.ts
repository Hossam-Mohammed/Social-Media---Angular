import {
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
  viewChild,
  type AfterViewInit,
  type InputSignal,
  type OnInit,
  type WritableSignal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/Auth/auth.service.js';
import { initFlowbite } from 'flowbite';
import { NotificationsService } from '../../../../core/services/Notifications/notifications.service.js';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit, AfterViewInit {
  private _AuthService = inject(AuthService);
  private _NotificationsService = inject(NotificationsService);
  notificationCount: WritableSignal<number> = signal(0);
  userImage: WritableSignal<string> = signal('');
  userName: WritableSignal<string> = signal('');

  flag: InputSignal<boolean> = input.required();

  ngOnInit(): void {
    setTimeout(() => {
      initFlowbite();
      this.getUserImg();
      this.getNotificationCount();
    }, 3);
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

  ngAfterViewInit(): void {
    this.getNotificationCount();
  }

  getNotificationCount() {
    this._NotificationsService.GetNotificationsCount().subscribe({
      next: (res) => {
        console.log(JSON.stringify(res.data.unreadCount));
        this.notificationCount.set(res.data.unreadCount);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  logOut(): void {
    this._AuthService.SignOut();
    // call your auth logic here, e.g. remove the token and navigate to /login
  }
}
