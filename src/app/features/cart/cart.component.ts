import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { Product, CartItem } from '../../core/models/product.model';

interface DetailedCartItem {
  id: number;
  qty: number;
  product: Product;
  unitPrice: number;
  lineTotal: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html'
})
export class CartComponent implements OnInit {
  public detailedItems: DetailedCartItem[] = [];
  public subtotal: number = 0;
  public shipping: number = 0;
  public total: number = 0;
  private allProducts: Product[] = [];

  constructor(
    private cartService: CartService, 
    private productService: ProductService,
    private cdr: ChangeDetectorRef // <--- 1. Inyectamos el detector de cambios
  ) {}

  ngOnInit(): void {
    this.productService.getProducts().subscribe(products => {
      this.allProducts = products;
      this.cartService.cartItems$.subscribe(cartItems => this.buildCartSummary(cartItems));
    });
  }

  private buildCartSummary(cartItems: CartItem[]): void {
    this.detailedItems = [];
    this.subtotal = 0;

    for (const item of cartItems) {
      // Forzamos a que ambos IDs se comparen estrictamente como números
      const product = this.allProducts.find(p => Number(p.id) === Number(item.id));
      if (product) {
        const unitPrice = this.cartService.priceFor(product, item.qty);
        const lineTotal = unitPrice * item.qty;
        this.detailedItems.push({ id: item.id, qty: item.qty, product, unitPrice, lineTotal });
        this.subtotal += lineTotal;
      }
    }
    
    // Lógica de envíos Braedt
    this.shipping = (this.subtotal >= 600 || this.subtotal === 0) ? 0 : 19.90;
    this.total = this.subtotal + this.shipping;

    // <--- 2. Obligamos a Angular a repintar el HTML con los datos finales calculados
    this.cdr.detectChanges();
  }

  public updateQty(productId: number, newQty: number): void {
    this.cartService.updateQty(productId, newQty);
  }

  public removeItem(productId: number): void {
    this.cartService.removeFromCart(productId);
  }
}