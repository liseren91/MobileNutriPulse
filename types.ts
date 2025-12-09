export enum ViewState {
  ONBOARDING = "ONBOARDING",
  DASHBOARD = "DASHBOARD",
  MEALS = "MEALS",
  SHOPPING = "SHOPPING",
  CHAT = "CHAT",
  STATS = "STATS",
  INSIGHTS = "INSIGHTS",
  PROFILE = "PROFILE",
}

export interface MacroDistribution {
  protein: number; // percentage
  carbs: number; // percentage
  fat: number; // percentage
}

export interface Trophy {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  grade: "excellent" | "good" | "effort"; // excellent = полное выполнение, good = 70-80%, effort = провал
  threeDayPeriod: {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
  };
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
  language: "ru" | "en"; // New language field
  planStartDate?: number; // Timestamp when the current meal plan was created
  // Profile settings
  preferredIngredients?: string; // What user likes to eat
  calorieGoal?: number; // Daily calorie goal
  macroDistribution?: MacroDistribution; // БЖУ distribution (percentages)
  activePlanDay?: number; // Active day of the plan (1-3)
  trackingStartDate?: number; // Timestamp when user started tracking
  trophies?: Trophy[]; // Array of earned trophies
}

export interface Ingredient {
  item: string;
  amount: string;
  checked: boolean;
}

export interface Meal {
  id: string;
  day: number; // 1, 2, 3
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  name: string;
  description: string;
  prepTime: string; // Must be "5-10 mins"
  ingredients: string[];
  instructions: string[];
  calories?: number;
  completedAt?: number; // Timestamp when meal was completed
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
}

export interface OffPlanMealEntry {
  id: string;
  description: string;
  timestamp: number;
  estimatedCalories?: number; // Estimated calories from AI or user input
  day?: number; // Which day of the plan this was eaten on
}

export interface Macronutrients {
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export interface EatenMealEntry {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  calories: number;
  macronutrients?: Macronutrients; // БЖУ
  activityHours?: number; // Примерно на сколько часов активности
  source: "planned" | "off-plan" | "photo"; // Откуда взялась еда
  mealId?: string; // ID из плана, если это planned
  day?: number; // День плана
}

export interface DailyHistoryEntry {
  date: string; // YYYY-MM-DD format
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  meals: EatenMealEntry[]; // All meals eaten on this day
}
