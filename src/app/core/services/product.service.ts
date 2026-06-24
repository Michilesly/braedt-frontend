import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  
  private dataUrl = '/data/products.json';

  constructor(private http: HttpClient) {}

  public getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.dataUrl).pipe(
      catchError(error => {
        console.error('Error crítico al leer products.json:', error);
        return of([]); 
      })
    );
  }
}