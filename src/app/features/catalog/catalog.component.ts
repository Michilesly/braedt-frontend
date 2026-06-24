import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <--- MAGIA DE ANGULAR AQUI
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent], // <--- Importamos FormsModule
  templateUrl: './catalog.component.html'
})
export class CatalogComponent implements OnInit {
  public products: Product[] = [];
  public isLoading: boolean = true;

  // --- VARIABLES DE LOS FILTROS ---
  public searchTerm: string = '';
  public selectedCategory: string = 'Todos';
  public minPrice: number | null = null;
  public maxPrice: number | null = null;
  public sortOption: string = 'relevance';

  public categories: string[] = ['Todos', 'Jamones', 'Pavo', 'Salchichas', 'Chorizos', 'Ahumados', 'Fiambres', 'Packs', 'Básicos'];

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando productos', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- MOTOR DE FILTRADO AUTOMÁTICO ---
  get filteredProducts(): Product[] {
    let result = this.products;

    // 1. Búsqueda por texto
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term));
    }

    // 2. Filtro por categoría
    if (this.selectedCategory !== 'Todos') {
      result = result.filter(p => p.category === this.selectedCategory);
    }

    // 3. Rango de Precios
    if (this.minPrice !== null && this.minPrice > 0) {
      result = result.filter(p => p.price >= this.minPrice!);
    }
    if (this.maxPrice !== null && this.maxPrice > 0) {
      result = result.filter(p => p.price <= this.maxPrice!);
    }

    // 4. Ordenamiento
    if (this.sortOption === 'asc') {
      result = result.sort((a, b) => a.price - b.price);
    } else if (this.sortOption === 'desc') {
      result = result.sort((a, b) => b.price - a.price);
    }

    return result;
  }

  public setCategory(cat: string): void {
    this.selectedCategory = cat;
  }
}