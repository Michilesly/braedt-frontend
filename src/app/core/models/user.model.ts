export interface User {
  id: string;
  name: string;
  email: string;
  ruc?: string;
  companyName?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password?: string;
  ruc?: string;
  companyName?: string;
  phone?: string;
  address?: string;
}
