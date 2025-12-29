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
  diamonds: string;
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

export interface BackendPurchase {
  _id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  transactionId: string;
  amount: number;
  price?: number;
  productId: string;
  productName?: string;
  diamonds?: number;
  paymentMethod: 'bkash' | 'robo' | 'uddokta';
  status: 'pending' | 'verified' | 'rejected' | 'failed' | 'completed';
  updatedBalance?: number;
  createdAt: string;
  verifiedAt?: string;
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
  diamonds: string;
  price: number;
  bonus?: string;
  tag?: string;
}

