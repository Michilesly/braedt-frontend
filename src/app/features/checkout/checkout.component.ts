import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { OrdersService } from '../../core/services/orders.service';
import { Order } from '../../core/models/order.model';

interface DetailedCheckoutItem {
  id: number;
  qty: number;
  product: Product;
  unitPrice: number;
  lineTotal: number;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  public customerName: string = '';
  public address: string = '';
  public paymentMethod: string = 'tarjeta';
  public deliveryDate: string = '';
  public minDate: string = '';
  
  public isProcessing: boolean = false;
  public isOrderConfirmed: boolean = false;
  public orderCode: string = '';

  // Propiedades del Método de Pago (HU-014)
  public cardNumber: string = '';
  public cardName: string = '';
  public cardExpiry: string = '';
  public cardCvv: string = '';
  public detectedCardBrand: 'visa' | 'mastercard' | 'amex' | 'unknown' = 'unknown';
  public walletPhone: string = '';
  public yapeOtp: string = '';

  // Propiedades del Resumen de Compra
  public detailedItems: DetailedCheckoutItem[] = [];
  public subtotal: number = 0;
  public shipping: number = 0;
  public total: number = 0;

  private allProducts: Product[] = [];
  private userSub!: Subscription;
  private cartSub!: Subscription;

  constructor(
    private cartService: CartService, 
    private authService: AuthService,
    private productService: ProductService,
    private ordersService: OrdersService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.calculateDeliveryDates();
  }

  ngOnInit(): void {
    if (this.cartService.getSnapshot().length === 0 && !this.isOrderConfirmed) {
      this.router.navigate(['/catalogo']);
      return;
    }

    // Suscribirse a la sesión del usuario para jalar sus datos por defecto
    this.userSub = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.customerName = user.companyName || user.name;
        this.address = user.address || '';
      } else {
        this.customerName = '';
        this.address = '';
      }
      this.cdr.detectChanges();
    });

    // Cargar productos para cruzar con el carrito y armar el resumen
    this.productService.getProducts().subscribe(products => {
      this.allProducts = products;
      
      this.cartSub = this.cartService.cartItems$.subscribe(cartItems => {
        this.buildCheckoutSummary(cartItems);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
    if (this.cartSub) {
      this.cartSub.unsubscribe();
    }
  }

  private buildCheckoutSummary(cartItems: any[]): void {
    this.detailedItems = [];
    this.subtotal = 0;

    for (const item of cartItems) {
      const product = this.allProducts.find(p => Number(p.id) === Number(item.id));
      if (product) {
        const unitPrice = this.cartService.priceFor(product, item.qty);
        const lineTotal = unitPrice * item.qty;
        this.detailedItems.push({
          id: item.id,
          qty: item.qty,
          product,
          unitPrice,
          lineTotal
        });
        this.subtotal += lineTotal;
      }
    }
    
    // Lógica de envíos Braedt
    this.shipping = (this.subtotal >= 600 || this.subtotal === 0) ? 0 : 19.90;
    this.total = this.subtotal + this.shipping;
    this.cdr.detectChanges();
  }

  private calculateDeliveryDates(): void {
    // La fecha mínima permitida de entrega es mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    
    this.minDate = `${yyyy}-${mm}-${dd}`;
    this.deliveryDate = this.minDate; // Valor por defecto
  }

  // Métodos de Entrada y Formateo (HU-014)
  public onCardNumberInput(event: any): void {
    let val = event.target.value.replace(/\D/g, '');
    
    // Formatear el número de tarjeta en bloques de 4 para mejor UX
    let formatted = '';
    if (val.length > 0) {
      const parts = val.match(/.{1,4}/g);
      if (parts) {
        formatted = parts.join(' ');
      }
    }
    this.cardNumber = formatted;

    // Limitar largo máximo a 19 caracteres (incluyendo espacios, ej: 16 digitos + 3 espacios = 19)
    if (this.cardNumber.length > 19) {
      this.cardNumber = this.cardNumber.slice(0, 19);
      val = val.slice(0, 16);
    }

    // Detección de marca
    if (val.startsWith('4')) {
      this.detectedCardBrand = 'visa';
    } else if (/^(5[1-5]|2[2-7])/.test(val)) {
      this.detectedCardBrand = 'mastercard';
    } else if (/^(34|37)/.test(val)) {
      this.detectedCardBrand = 'amex';
    } else {
      this.detectedCardBrand = 'unknown';
    }
    this.cdr.detectChanges();
  }

  public onCardExpiryInput(event: any): void {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 2) {
      val = val.slice(0, 2) + '/' + val.slice(2, 4);
    }
    if (val.length > 5) {
      val = val.slice(0, 5);
    }
    this.cardExpiry = val;
    this.cdr.detectChanges();
  }

  public onCardCvvInput(event: any): void {
    let val = event.target.value.replace(/\D/g, '');
    const maxLength = this.detectedCardBrand === 'amex' ? 4 : 3;
    if (val.length > maxLength) {
      val = val.slice(0, maxLength);
    }
    this.cardCvv = val;
    this.cdr.detectChanges();
  }

  public onWalletPhoneInput(event: any): void {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 9) {
      val = val.slice(0, 9);
    }
    this.walletPhone = val;
    this.cdr.detectChanges();
  }

  public onYapeOtpInput(event: any): void {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 6) {
      val = val.slice(0, 6);
    }
    this.yapeOtp = val;
    this.cdr.detectChanges();
  }

  public isPaymentFormValid(): boolean {
    if (this.paymentMethod === 'tarjeta') {
      const digitsOnly = this.cardNumber.replace(/\D/g, '');
      const isCardNumOk = this.detectedCardBrand === 'amex' ? digitsOnly.length === 15 : digitsOnly.length === 16;
      const isNameOk = this.cardName.trim().length >= 3;
      const isExpiryOk = /^(0[1-9]|1[0-2])\/\d{2}$/.test(this.cardExpiry);
      const isCvvOk = this.detectedCardBrand === 'amex' ? this.cardCvv.length === 4 : this.cardCvv.length === 3;
      return !!(isCardNumOk && isNameOk && isExpiryOk && isCvvOk);
    }
    if (this.paymentMethod === 'yape') {
      const isPhoneOk = this.walletPhone.length === 9 && this.walletPhone.startsWith('9');
      const isOtpOk = this.yapeOtp.length === 6;
      return !!(isPhoneOk && isOtpOk);
    }
    if (this.paymentMethod === 'plin') {
      const isPhoneOk = this.walletPhone.length === 9 && this.walletPhone.startsWith('9');
      return !!isPhoneOk;
    }
    if (this.paymentMethod === 'contraentrega') {
      return true;
    }
    return false;
  }

  public confirmOrder(): void {
    if (!this.customerName || !this.address || !this.deliveryDate || !this.isPaymentFormValid()) {
      return; // Evita confirmación si faltan datos obligatorios o de pago
    }

    this.isProcessing = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      // Generar código único aleatorio (HU-016): BR-XXXXX
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      this.orderCode = `BR-${randomNum}`;

      // Mapear los ítems detallados para guardar (HU-017)
      const orderItems = this.detailedItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        qty: item.qty,
        price: item.unitPrice,
        lineTotal: item.lineTotal,
        image: item.product.image
      }));

      // Etiqueta legible del método de pago (HU-014)
      let paymentLabel = '';
      if (this.paymentMethod === 'tarjeta') {
        const last4 = this.cardNumber.replace(/\D/g, '').slice(-4);
        const brandName = this.detectedCardBrand === 'visa' ? 'Visa' : 
                          this.detectedCardBrand === 'mastercard' ? 'Mastercard' : 
                          this.detectedCardBrand === 'amex' ? 'Amex' : 'Tarjeta';
        paymentLabel = `${brandName} terminada en ${last4}`;
      } else if (this.paymentMethod === 'yape') {
        paymentLabel = `Yape (Cel: ${this.walletPhone.slice(0, 3)}***${this.walletPhone.slice(-3)})`;
      } else if (this.paymentMethod === 'plin') {
        paymentLabel = `Plin (Cel: ${this.walletPhone.slice(0, 3)}***${this.walletPhone.slice(-3)})`;
      } else {
        paymentLabel = 'Pago Contraentrega';
      }

      // Crear el objeto Order
      const newOrder: Order = {
        id: this.orderCode,
        customerName: this.customerName,
        email: this.authService.currentUserValue?.email || 'invitado@braedt.pe',
        address: this.address,
        deliveryDate: this.deliveryDate,
        paymentMethod: paymentLabel,
        items: orderItems,
        subtotal: this.subtotal,
        shipping: this.shipping,
        total: this.total,
        status: 'Registrado', // Inicia en estado Registrado (HU-018)
        createdAt: new Date().toISOString()
      };

      // Guardar usando OrdersService
      this.ordersService.saveOrder(newOrder).subscribe(() => {
        this.cartService.clearCart();
        this.isProcessing = false;
        this.isOrderConfirmed = true;
        this.cdr.detectChanges();
      });
    }, 1500);
  }
}