import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrdersService } from '../../core/services/orders.service';
import { AuthService } from '../../core/services/auth.service';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrls: []
})
export class OrdersComponent implements OnInit, OnDestroy {
  public orders: Order[] = [];
  public selectedOrder: Order | null = null;
  public isLoading: boolean = true;
  public loggedInUserEmail: string | null = null;

  private userSub!: Subscription;
  private ordersSub!: Subscription;

  constructor(
    private ordersService: OrdersService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. Suscribirse al usuario activo
    this.userSub = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loggedInUserEmail = user.email;
        this.loadUserOrders(user.email);
      } else {
        this.loggedInUserEmail = null;
        this.orders = [];
        this.selectedOrder = null;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
    if (this.ordersSub) {
      this.ordersSub.unsubscribe();
    }
  }

  private loadUserOrders(email: string): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    if (this.ordersSub) {
      this.ordersSub.unsubscribe();
    }

    this.ordersSub = this.ordersService.getOrdersByUser(email).subscribe({
      next: (userOrders) => {
        this.orders = userOrders;
        if (userOrders.length > 0) {
          // Por defecto, seleccionamos la orden más reciente
          this.selectedOrder = userOrders[0];
        } else {
          this.selectedOrder = null;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar historial de pedidos:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  public selectOrder(order: Order): void {
    this.selectedOrder = order;
    this.cdr.detectChanges();
  }

  /**
   * Retorna las clases CSS y el estado de progreso para el Stepper de Trazabilidad (HU-018)
   */
  public getStatusStepIndex(status: string): number {
    switch (status) {
      case 'Registrado': return 0;
      case 'En preparación': return 1;
      case 'En camino': return 2;
      case 'Entregado': return 3;
      default: return 0;
    }
  }

  /**
   * Retorna clases de color de bootstrap para las etiquetas de estado
   */
  public getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Registrado':
        return 'bg-info-subtle text-info border border-info-subtle';
      case 'En preparación':
        return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'En camino':
        return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'Entregado':
        return 'bg-success-subtle text-success border border-success-subtle';
      default:
        return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
    }
  }
}
