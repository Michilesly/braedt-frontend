import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';

interface RecipeIngredient {
  name: string;
  baseQtyPerPerson: number; // Cantidad base por persona (en unidades o fracción de pack)
  unit: string; // Gramos, unidades, etc.
  productId?: number; // ID en el catálogo si es producto Braedt
  product?: Product;  // Instancia cargada del producto
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string;
  category: 'desayuno' | 'almuerzo' | 'cena' | 'piqueo';
  prepTime: string;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  ingredients: RecipeIngredient[];
}

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './recipes.component.html'
})
export class RecipesComponent implements OnInit {
  public recipes: Recipe[] = [];
  public selectedRecipe: Recipe | null = null;
  public servings: number = 4; // Porciones iniciales
  public activeCategory: string = 'todas';
  public allProducts: Product[] = [];
  public showSuccessToast: boolean = false;
  public toastMessage: string = '';

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {
    this.initRecipesData();
  }

  ngOnInit(): void {
    // Cargar productos para cruzar con los ingredientes
    this.productService.getProducts().subscribe(products => {
      this.allProducts = products;
      this.mapProductsToIngredients();
      if (this.recipes.length > 0) {
        this.selectedRecipe = this.recipes[0];
      }
      this.cdr.detectChanges();
    });
  }

  private initRecipesData(): void {
    this.recipes = [
      {
        id: 'receta-1',
        name: 'Butifarra Tradicional Peruana',
        description: 'El sándwich criollo favorito de los domingos por la mañana. Jamón del país casero con salsa criolla cítrica en pan francés crocante.',
        image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
        category: 'desayuno',
        prepTime: '15 min',
        difficulty: 'Fácil',
        ingredients: [
          { name: 'Jamón del País Braedt', baseQtyPerPerson: 0.166, unit: 'paquete(s) de 500g', productId: 211 }, // 1 pack = 6 personas
          { name: 'Pan francés crocante', baseQtyPerPerson: 1, unit: 'unidad(es)' },
          { name: 'Cebolla roja en plumas', baseQtyPerPerson: 40, unit: 'gramos' },
          { name: 'Limón exprimido', baseQtyPerPerson: 0.5, unit: 'unidad(es)' },
          { name: 'Ají amarillo picado', baseQtyPerPerson: 0.2, unit: 'unidad(es)' },
          { name: 'Hojas de lechuga fresca', baseQtyPerPerson: 1, unit: 'hoja(s)' }
        ]
      },
      {
        id: 'receta-2',
        name: 'Choripán Criollo al Chimichurri',
        description: 'El clásico indiscutible de las parrillas familiares. Chorizos parrilleros jugosos cocinados a fuego lento dentro de pan baguette caliente.',
        image: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=800&q=80',
        category: 'cena',
        prepTime: '20 min',
        difficulty: 'Fácil',
        ingredients: [
          { name: 'Chorizo Parrillero Braedt', baseQtyPerPerson: 0.25, unit: 'paquete(s) de 500g', productId: 205 }, // 1 pack = 4 personas
          { name: 'Pan Baguette o Pan francés', baseQtyPerPerson: 1, unit: 'unidad(es)' },
          { name: 'Salsa Chimichurri casera', baseQtyPerPerson: 20, unit: 'gramos' }
        ]
      },
      {
        id: 'receta-3',
        name: 'Salchipapa Criolla Gourmet',
        description: 'Salchichas tipo Frankfurt doradas y cortadas en rodajas, servidas sobre una montaña de papas amarillas fritas crujientes.',
        image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
        category: 'almuerzo',
        prepTime: '25 min',
        difficulty: 'Fácil',
        ingredients: [
          { name: 'Salchicha Frankfurt Braedt', baseQtyPerPerson: 0.125, unit: 'bolsa(s) de 1kg', productId: 203 }, // 1 pack = 8 personas
          { name: 'Papas amarillas para freír', baseQtyPerPerson: 200, unit: 'gramos' },
          { name: 'Aceite vegetal para freír', baseQtyPerPerson: 25, unit: 'mililitros' },
          { name: 'Cremas (mayonesa, mostaza, ketchup)', baseQtyPerPerson: 15, unit: 'gramos' }
        ]
      },
      {
        id: 'receta-4',
        name: 'Tabla de Fiambres y embutidos Premium',
        description: 'La combinación perfecta de fiambres curados y quesos, ideal para compartir como entrada en reuniones, directorios o banquetes.',
        image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80',
        category: 'piqueo',
        prepTime: '15 min',
        difficulty: 'Medio',
        ingredients: [
          { name: 'Salami Premium Braedt', baseQtyPerPerson: 0.1, unit: 'paquete(s) de 250g', productId: 216 }, // 1 pack = 10 personas
          { name: 'Jamón Inglés Braedt', baseQtyPerPerson: 0.125, unit: 'paquete(s) de 250g', productId: 201 }, // 1 pack = 8 personas
          { name: 'Mortadela Bolognesa Braedt', baseQtyPerPerson: 0.083, unit: 'paquete(s) de 500g', productId: 207 }, // 1 pack = 12 personas
          { name: 'Tostadas o galletas saladas', baseQtyPerPerson: 25, unit: 'gramos' },
          { name: 'Queso Edam en cubos', baseQtyPerPerson: 30, unit: 'gramos' },
          { name: 'Uvas verdes o aceitunas', baseQtyPerPerson: 20, unit: 'gramos' }
        ]
      }
    ];
  }

  private mapProductsToIngredients(): void {
    if (this.allProducts.length === 0) return;
    
    for (const recipe of this.recipes) {
      for (const ingredient of recipe.ingredients) {
        if (ingredient.productId) {
          const product = this.allProducts.find(p => Number(p.id) === Number(ingredient.productId));
          if (product) {
            ingredient.product = product;
          }
        }
      }
    }
  }

  public selectRecipe(recipe: Recipe): void {
    this.selectedRecipe = recipe;
    this.cdr.detectChanges();
  }

  public setCategory(category: string): void {
    this.activeCategory = category;
    
    // Si la receta actual se filtra y ya no es visible, seleccionamos la primera del filtro
    const filtered = this.getFilteredRecipes();
    if (filtered.length > 0 && (!this.selectedRecipe || !filtered.includes(this.selectedRecipe))) {
      this.selectedRecipe = filtered[0];
    }
    this.cdr.detectChanges();
  }

  public getFilteredRecipes(): Recipe[] {
    if (this.activeCategory === 'todas') {
      return this.recipes;
    }
    return this.recipes.filter(r => r.category === this.activeCategory);
  }

  /**
   * Calcula la cantidad exacta requerida en base a comensales.
   */
  public calculateRequiredQty(baseQty: number): number {
    return Math.ceil(this.servings * baseQty);
  }

  /**
   * Calcula la cantidad real a comprar respetando el MOQ del catálogo.
   */
  public calculatePurchaseQty(ingredient: RecipeIngredient): number {
    const required = this.calculateRequiredQty(ingredient.baseQtyPerPerson);
    if (ingredient.product) {
      return Math.max(required, ingredient.product.moq || 1);
    }
    return required;
  }

  /**
   * Agrega todos los ingredientes que pertenezcan a Braedt al carrito
   */
  public addIngredientsToCart(): void {
    if (!this.selectedRecipe) return;

    let addedCount = 0;
    
    for (const ingredient of this.selectedRecipe.ingredients) {
      if (ingredient.productId && ingredient.product) {
        const qtyToBuy = this.calculatePurchaseQty(ingredient);
        this.cartService.addToCart(ingredient.product.id, qtyToBuy);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      this.toastMessage = `¡Se agregaron los embutidos para ${this.servings} comensales al carrito respetando el pedido mínimo (MOQ)!`;
      this.showSuccessToast = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 4000);
    }
  }
}
