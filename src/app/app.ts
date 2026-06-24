import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from './core/services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  public currentYear: number = new Date().getFullYear();
  public isMobileMenuOpen: boolean = false;
  public cartCount: number = 0;
  public userName: string = 'Mi cuenta';

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe(items => {
      this.cartCount = items.reduce((sum, item) => sum + item.qty, 0);
    });
  }

  public toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  public onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.value) {
      console.log('Buscando:', input.value);
    }
  }
}