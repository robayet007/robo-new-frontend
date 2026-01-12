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
  dealId?: string | null;
  image?: string;
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
  diamonds?: string;
  playerId?: string;
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
  dealId?: string | null;
  image?: string;
}

export interface BackendDeal {
  _id: string;
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendBanner {
  _id: string;
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface BackendNotice {
  _id: string;
  id: string;
  title?: string;
  message: string;
  icon?: string;
  features?: Array<{
    icon?: string;
    text: string;
  }>;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface BackendGamePackage {
  _id: string;
  id: string;
  title: string;
  image: string;
  entryFee: number;
  winnerPrize: string;
  description?: string;
  roomId?: string;
  roomPassword?: string;
  maxPurchases: number;
  purchaseCount: number;
  isActive: boolean;
  startTime: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendGamePackagePurchase {
  _id: string;
  packageId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  transactionId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  purchasedAt: string;
  credentialExpiresAt?: string;
  isExpired?: boolean;
  // Additional fields when fetched with package details
  title?: string;
  image?: string;
  winnerPrize?: string;
  description?: string;
  roomId?: string | null;
  roomPassword?: string | null;
}

export type Deal = {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
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

