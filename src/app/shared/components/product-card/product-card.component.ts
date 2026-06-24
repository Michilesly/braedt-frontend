import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html'
})
export class ProductCardComponent implements OnInit {
  @Input({ required: true }) product!: Product;
  public currentMinPrice: number = 0;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    const targetQty = this.product.moq || 1;
    // Utilizamos el servicio del carrito para calcular el mejor precio
    // basándonos en los tiers (escalas)
    if (this.product.tiers && this.product.tiers.length > 0) {
      const sortedTiers = [...this.product.tiers].sort((a, b) => b.minQty - a.minQty);
      const applicableTier = sortedTiers.find(t => targetQty >= t.minQty);
      this.currentMinPrice = applicableTier ? applicableTier.price : this.product.price;
    } else {
      this.currentMinPrice = this.product.price;
    }
  }

  public onAddToCart(): void {
    // Agrega el producto y la cantidad mínima al carrito
    this.cartService.addToCart(this.product.id, this.product.moq || 1);
  }
}