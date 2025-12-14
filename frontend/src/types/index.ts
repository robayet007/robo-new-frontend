// ==================== API TYPES ====================
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

export interface BackendProduct {
  _id: string;
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  diamonds: number;
  price: number;
  bonus?: string;
  tag?: string;
  isActive: boolean;
}

export interface BackendCategory {
  _id: string;
  id: string;
  name: string;
  description?: string;
  badge?: string;
  isActive: boolean;
}

// ==================== APP TYPES ====================
export type Category = {
  id: string;
  name: string;
  description?: string;
  badge?: string;
}

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  diamonds: number;
  price: number;
  bonus?: string;
  tag?: string;
}

