export interface PriceTier {
  minQty: number;
  price: number;
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  unit: string;
  packSize: number;
  price: number;
  moq: number;
  stock: number;
  image: string | null;
  tags: string[];
  tiers?: PriceTier[];
  description?: string;
  onSale: boolean;
  isFavorite: boolean;
}

export interface CartItem {
  id: number;
  qty: number;
}