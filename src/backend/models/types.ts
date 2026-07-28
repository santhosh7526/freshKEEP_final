export interface FoodItem {
  id: string;
  name: string;
  category: 'dairy' | 'meat' | 'vegetables' | 'pantry' | 'canned';
  expiryDate: string;
  addedDate: string;
  freshnessScore: number; // 0-100
  confidence: number; // OCR confidence 0-100
  price?: number; // Price in rupees
  quantity?: number; // Quantity
  unit?: string; // Unit (kg, L, pieces, etc)
  barcode?: string; // Barcode for product identification
}

export interface WasteLogEntry {
  id: string;
  itemName: string;
  category: string;
  wastedDate: string;
  estimatedValue: number; // in rupees
  reason: 'expired' | 'spoiled' | 'other';
}

export interface NotificationSettings {
  enabled: boolean;
  leadTimes: {
    dairy: number;
    meat: number;
    vegetables: number;
    pantry: number;
    canned: number;
  };
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  cookTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
