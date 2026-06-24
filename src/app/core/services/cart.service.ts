import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem, Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'mp_cart';
  private cartItemsSubject: BehaviorSubject<CartItem[]>;
  public cartItems$: Observable<CartItem[]>;

  constructor() {
    const initialCart = this.loadFromStorage();
    this.cartItemsSubject = new BehaviorSubject<CartItem[]>(initialCart);
    this.cartItems$ = this.cartItemsSubject.asObservable();
  }

  private loadFromStorage(): CartItem[] {
    try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY) ?? '[]'); } 
    catch { return []; }
  }

  private saveToStorage(items: CartItem[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this.cartItemsSubject.next(items);
  }

  public getSnapshot(): CartItem[] {
    return this.cartItemsSubject.getValue();
  }

  public addToCart(productId: number, qty: number = 1): void {
    const currentItems = this.getSnapshot();
    const existingItem = currentItems.find(item => item.id === productId);
    let updatedItems = existingItem 
      ? currentItems.map(item => item.id === productId ? { ...item, qty: Math.max(0, item.qty + qty) } : item)
      : [...currentItems, { id: productId, qty }];
    
    this.saveToStorage(updatedItems.filter(item => item.qty > 0));
  }

  // NUEVO: Métodos para controlar el carrito en la vista
  public updateQty(productId: number, qty: number): void {
    const updatedItems = this.getSnapshot().map(item =>
      item.id === productId ? { ...item, qty: Math.max(0, qty) } : item
    ).filter(item => item.qty > 0);
    this.saveToStorage(updatedItems);
  }

  public removeFromCart(productId: number): void {
    this.saveToStorage(this.getSnapshot().filter(item => item.id !== productId));
  }

  // NUEVO: Motor de cálculo de precios por escala (Tiers)
  public priceFor(product: Product, qty: number): number {
    if (!product.tiers || product.tiers.length === 0) return product.price;
    const sortedTiers = [...product.tiers].sort((a, b) => b.minQty - a.minQty);
    const applicableTier = sortedTiers.find(t => qty >= t.minQty);
    return applicableTier ? applicableTier.price : product.price;
  }

  public clearCart(): void {
    this.saveToStorage([]);
  }
}