import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. IMPORTA ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit {
  public customerName: string = 'Bodega San Martín';
  public address: string = 'Av. San Martín 456, Lima';
  public paymentMethod: string = 'tarjeta';
  public isProcessing: boolean = false;
  public isOrderConfirmed: boolean = false;

  constructor(
    private cartService: CartService, 
    private router: Router,
    private cdr: ChangeDetectorRef // 2. INYECTA EL DETECTOR
  ) {}

  ngOnInit(): void {
    if (this.cartService.getSnapshot().length === 0 && !this.isOrderConfirmed) {
      this.router.navigate(['/catalogo']);
    }
  }

  public confirmOrder(): void {
    this.isProcessing = true;
    this.cdr.detectChanges(); // 3. FORZAMOS EL REPAINT AL INICIAR

    setTimeout(() => {
      this.cartService.clearCart();
      this.isProcessing = false;
      this.isOrderConfirmed = true;
      this.cdr.detectChanges(); // 4. FORZAMOS EL REPAINT AL FINALIZAR
    }, 1500);
  }
}