import { Component, inject, signal, ViewChild, type ElementRef } from '@angular/core';
import { PostsService } from '../../../../core/services/Posts/posts.service.js';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-left-side',
  imports: [],
  templateUrl: './left-side.component.html',
  styleUrl: './left-side.component.css',
})
export class LeftSideComponent {
  protected readonly _PostService = inject(PostsService);
}
