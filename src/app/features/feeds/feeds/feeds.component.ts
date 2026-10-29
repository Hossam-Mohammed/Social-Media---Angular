import { Component } from '@angular/core';
import { LeftSideComponent } from '../Left-Side/left-side/left-side.component.js';
import { RightSideComponent } from '../Right-Side/right-side/right-side.component.js';
import { PostsComponent } from '../Post/posts/posts.component.js';
import { CreatepostComponent } from '../Post/createpost/createpost.component.js';

@Component({
  selector: 'app-feeds',
  imports: [LeftSideComponent, RightSideComponent, PostsComponent, CreatepostComponent],
  templateUrl: './feeds.component.html',
  styleUrl: './feeds.component.css',
})
export class FeedsComponent {}
