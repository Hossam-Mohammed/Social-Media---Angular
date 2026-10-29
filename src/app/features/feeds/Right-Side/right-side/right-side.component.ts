import { Component, inject, signal, type OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/Auth/auth.service.js';
import type { Suggestion } from '../../../../core/models/Suggestion/suggestion.interface.js';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-right-side',
  imports: [RouterLink],
  templateUrl: './right-side.component.html',
  styleUrl: './right-side.component.css',
})
export class RightSideComponent implements OnInit {
  private _AuthService = inject(AuthService);
  suggestions = signal<Suggestion[]>([]);

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.getSuggestion();
  }

  getSuggestion() {
    this._AuthService.GetFollowSuggestions().subscribe({
      next: (res) => {
        this.suggestions.set(res.data?.suggestions ?? []);
        console.log(res.data.suggestions);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  followUser(userId: string) {
    this._AuthService.FollowUser(userId).subscribe({
      next: (res) => {
        console.log('Follow Success' + res);
        this.getSuggestion();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
}
