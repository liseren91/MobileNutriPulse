export enum ViewState {
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  MEALS = 'MEALS',
  SHOPPING = 'SHOPPING',
  CHAT = 'CHAT'
}

export interface UserProfile {
  name: string;
  eatingFrequencyHours: number;
  dietaryPreferences: string;
  goals: string;
  lastMealTime: number | null; // Timestamp
  sleepStartHour: number;
  breakfastHour: number;
  excludedIngredients?: string; // New field for dislikes
}

export interface Ingredient {
  item: string;
  amount: string;
  checked: boolean;
}

export interface Meal {
  id: string;
  day: number; // 1, 2, 3
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  description: string;
  prepTime: string; // Must be "5-10 mins"
  ingredients: string[];
  instructions: string[];
  calories?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}