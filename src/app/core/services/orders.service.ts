import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private readonly ORDERS_STORAGE_KEY = 'braedt_orders_history';
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  // Memoria en caché para entornos sin localStorage (ej. pruebas en node, SSR)
  private memoryStorage: { [key: string]: string } = {};

  constructor() {
    this.loadOrders();
  }

  private getItem(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return this.memoryStorage[key] || null;
  }

  private setItem(key: string, value: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      this.memoryStorage[key] = value;
    }
    this.loadOrders();
  }

  private loadOrders(): void {
    try {
      const ordersStr = this.getItem(this.ORDERS_STORAGE_KEY);
      if (ordersStr) {
        this.ordersSubject.next(JSON.parse(ordersStr));
      } else {
        this.ordersSubject.next([]);
      }
    } catch (e) {
      console.error('Error al cargar historial de órdenes:', e);
      this.ordersSubject.next([]);
    }
  }

  /**
   * Obtiene las órdenes filtradas por correo electrónico del usuario.
   * Si no tiene órdenes, genera 2 de forma ficticia para ese correo para demostrar trazabilidad.
   */
  public getOrdersByUser(email: string): Observable<Order[]> {
    return this.orders$.pipe(
      map(orders => {
        const userOrders = orders.filter(o => o.email.toLowerCase() === email.toLowerCase());
        
        if (userOrders.length === 0) {
          // Generar órdenes mock iniciales para este correo
          const mockOrders = this.generateMockOrdersForUser(email);
          const allOrders = [...orders, ...mockOrders];
          this.setItem(this.ORDERS_STORAGE_KEY, JSON.stringify(allOrders));
          return mockOrders;
        }

        // Ordenar las órdenes: las más recientes primero
        return userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      })
    );
  }

  /**
   * Guarda una nueva orden en el historial local
   */
  public saveOrder(order: Order): Observable<boolean> {
    try {
      const currentOrders = JSON.parse(this.getItem(this.ORDERS_STORAGE_KEY) ?? '[]');
      currentOrders.push(order);
      this.setItem(this.ORDERS_STORAGE_KEY, JSON.stringify(currentOrders));
      
      // Simular latencia de guardado de red
      return of(true).pipe(delay(300));
    } catch (e) {
      console.error('Error al guardar la orden:', e);
      return of(false);
    }
  }

  /**
   * Genera 2 órdenes ficticias para un correo electrónico dado.
   */
  private generateMockOrdersForUser(email: string): Order[] {
    const today = new Date();
    
    // Pedido 1: Entregado hace 3 días
    const date1 = new Date();
    date1.setDate(today.getDate() - 4);
    const delivDate1 = new Date();
    delivDate1.setDate(today.getDate() - 3);

    const order1: Order = {
      id: 'BR-89312',
      customerName: email.split('@')[0],
      email: email,
      address: 'Av. Las Palmeras 142, San Isidro',
      deliveryDate: delivDate1.toISOString().split('T')[0],
      paymentMethod: 'tarjeta',
      items: [
        {
          productId: 101,
          name: 'Jamón del País Braedt',
          qty: 5,
          price: 45.00,
          lineTotal: 225.00,
          image: 'https://braedt.com.pe/build/assets/braedt-logo-white-KFemSUCQ.svg' // Placeholder
        },
        {
          productId: 102,
          name: 'Salchicha Frankfurt Ahumada 500g',
          qty: 10,
          price: 18.50,
          lineTotal: 185.00,
          image: null
        }
      ],
      subtotal: 410.00,
      shipping: 19.90,
      total: 429.90,
      status: 'Entregado',
      createdAt: date1.toISOString()
    };

    // Pedido 2: En preparación o En camino que se entrega mañana
    const date2 = new Date();
    date2.setDate(today.getDate() - 1);
    const delivDate2 = new Date();
    delivDate2.setDate(today.getDate() + 1);

    const order2: Order = {
      id: 'BR-41258',
      customerName: email.split('@')[0],
      email: email,
      address: 'Av. Las Palmeras 142, San Isidro',
      deliveryDate: delivDate2.toISOString().split('T')[0],
      paymentMethod: 'contraentrega',
      items: [
        {
          productId: 103,
          name: 'Chorizo Parrillero Precocido Braedt',
          qty: 15,
          price: 25.00,
          lineTotal: 375.00,
          image: null
        },
        {
          productId: 104,
          name: 'Tocino Ahumado Rebanado 250g',
          qty: 12,
          price: 22.00,
          lineTotal: 264.00,
          image: null
        }
      ],
      subtotal: 639.00,
      shipping: 0, // Gratis por superar S/ 600
      total: 639.00,
      status: 'En camino',
      createdAt: date2.toISOString()
    };

    return [order1, order2];
  }
}
