export interface OrderItem {
  productId: number;
  name: string;
  qty: number;
  price: number;
  lineTotal: number;
  image: string | null;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  address: string;
  deliveryDate: string;
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: 'Registrado' | 'En preparación' | 'En camino' | 'Entregado';
  createdAt: string;
}
