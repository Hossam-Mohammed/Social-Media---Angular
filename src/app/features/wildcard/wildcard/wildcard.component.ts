import { Component, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/NavBar/navbar/navbar.component.js';

@Component({
  selector: 'app-wildcard',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  templateUrl: './wildcard.component.html',
  styleUrl: './wildcard.component.css',
})
export class WildcardComponent implements OnInit {
  isLoggedIn = signal<boolean>(false);

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      this.isLoggedIn.set(!!localStorage.getItem('userToken'));
    }
  }
}
