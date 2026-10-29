import { Component, inject, signal, type Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PostsService } from '../../../../core/services/Posts/posts.service.js';

@Component({
  selector: 'app-createpost',
  imports: [ReactiveFormsModule],
  templateUrl: './createpost.component.html',
  styleUrl: './createpost.component.css',
})
export class CreatepostComponent {
  private _PostService = inject(PostsService);

  user = JSON.parse(localStorage.getItem('userInfo') ?? '{}');
  placeholder = `What's on your mind, ${(this.user.name ?? '').split(' ')[0]}?`;

  imgURL = signal<string | ArrayBuffer | null | undefined>('');
  isPosting = signal(false);
  postImg?: File;
  postBody = new FormControl('');
  postPrivacy = new FormControl('public');

  holdImg(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.postImg = input.files[0];
      this.readImg();
    }
  }

  readImg() {
    if (!this.postImg) return;
    const fileReader = new FileReader();
    fileReader.readAsDataURL(this.postImg);
    fileReader.onload = (e) => this.imgURL.set(e.target?.result);
  }

  createPost(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    const body = (this.postBody.value ?? '').trim();
    if (!body && !this.postImg) return; // nothing to post
    if (this.isPosting()) return;

    const formData = new FormData();
    if (body) formData.append('body', body);
    if (this.postImg) formData.append('image', this.postImg);
    formData.append('privacy', this.postPrivacy.value ?? 'public');

    this.isPosting.set(true);
    this._PostService.CreatePost(formData).subscribe({
      next: (res) => {
        console.log(res);
        form.reset(); // clears the native file input too
        this.postBody.reset('');
        this.postPrivacy.reset('public');
        this.postImg = undefined;
        this.imgURL.set('');
        this.isPosting.set(false);
      },
      error: (err) => {
        console.log(err.error);
        this.isPosting.set(false);
      },
    });
  }
}
