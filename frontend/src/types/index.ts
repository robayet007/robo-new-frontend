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
  ucCategory?: string;
  ucCategoryQuantities?: Array<{ ucCategory: string; quantity: number }>;
  topupType?: 'voucher' | 'shell';
  shellPackage?: string;
  shellAccountId?: string;
  price: number;
  resellerPrice?: number;
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
  userPhotoURL?: string;
  transactionId: string;
  amount: number;
  price?: number;
  productId: string;
  productName?: string;
  productImage?: string;
  diamonds?: string;
  playerId?: string;
  paymentMethod: 'bkash' | 'robo' | 'uddokta';
  status: 'pending' | 'verified' | 'processing' | 'rejected' | 'failed' | 'completed';
  updatedBalance?: number;
  ucCode?: string;
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
  link?: string;
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
  ucCategory?: string;
  ucCategoryQuantities?: Array<{ ucCategory: string; quantity: number }>;
  topupType?: 'voucher' | 'shell';
  shellPackage?: string;
  shellAccountId?: string;
  price: number;
  resellerPrice?: number;
  originalPrice?: number; // For resellers, original price is kept here
  bonus?: string;
  tag?: string;
}

export interface BackendDigitalCodeCategory {
  _id: string;
  id: string;
  name: string;
  description?: string;
  badge?: string;
  isActive: boolean;
  dealId?: string | null;
  image?: string;
  createdAt?: string;
}

export interface BackendDigitalCodeProduct {
  _id: string;
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description?: string;
  price: number;
  resellerPrice?: number;
  inputFields?: Array<{
    name: string;
    placeholder?: string;
    required?: boolean;
  }>;
  tag?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface BackendDigitalCode {
  _id: string;
  serialNumber: string;
  categoryId: string;
  productId?: string;
  code: string;
  prefix?: string;
  status: 'active' | 'used';
  purchasedAt?: string;
  purchasedBy?: {
    userId: string;
    userEmail: string;
    userName: string;
  };
  purchaseId?: string;
  createdAt?: string;
}

export interface BackendSubscriptionCategory {
  _id: string;
  id: string;
  name: string;
  description?: string;
  badge?: string;
  isActive: boolean;
  dealId?: string | null;
  image?: string;
  createdAt?: string;
}

export interface BackendSubscriptionProduct {
  _id: string;
  id: string;
  categoryId?: string | null;
  categoryName?: string;
  name: string;
  price: number;
  resellerPrice?: number;
  originalPrice?: number; // For resellers, original price is kept here
  description?: string;
  image?: string;
  tag?: string;
  bonus?: string;
  inputFields?: Array<{
    name: string;
    placeholder?: string;
    type?: string;
    required?: boolean;
  }>;
  isActive: boolean;
  createdAt?: string;
}

export interface BackendSubscriptionPurchase {
  _id: string;
  productId: string;
  productName: string;
  userId: string;
  userEmail: string;
  userName?: string;
  transactionId: string;
  amount: number;
  inputFieldValues?: Record<string, string>;
  status: string;
  purchasedAt?: string;
}

export interface BackendDigitalCodePurchase {
  _id: string;
  productId: string;
  productName: string;
  categoryId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  transactionId: string;
  amount: number;
  codeId: string;
  code: string;
  prefix?: string;
  inputFieldValues?: Record<string, string>;
  status: 'pending' | 'completed' | 'failed';
  purchasedAt: string;
}

export interface BackendMembershipPackage {
  _id: string;
  id: string;
  name: string;
  role: 'reseller';
  durationDays: number;
  price: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendMembershipPurchase {
  _id: string;
  userId: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  role: 'reseller';
  purchasedAt: string;
  expiresAt: string;
  status: 'active' | 'expired';
  transactionId: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  daysRemaining?: number;
}

