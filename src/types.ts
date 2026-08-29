export type ItemCategory =
  | 'food'
  | 'drinks'
  | 'decor'
  | 'tableware'
  | 'activities'
  | 'ice_utility'
  | 'favors';

export type StoreType =
  | 'CymbalMart Produce & Deli'
  | 'CymbalMart Bakery'
  | 'CymbalMart Butcher & Seafood'
  | 'CymbalMart Grocery & Pantry'
  | 'CymbalMart Cellars & Beverages'
  | 'CymbalMart Party & Tableware'
  | 'CymbalMart Ice & Frozen'
  | 'Cymbal Club Wholesale Bulk'
  | 'Grocery / Supermarket'
  | 'Costco / Wholesale'
  | 'Party / Amazon'
  | 'Liquor Store'
  | 'Bakery'
  | 'Dollar Store / General'
  | 'Specialty';

export type BrandType = 'Cymbal Choice' | 'Cymbal Organic' | 'Cymbal Club Bulk' | 'Brand Name';

export type PriorityLevel = 'must_have' | 'nice_to_have' | 'optional';

export interface ShoppingItem {
  id: string;
  name: string;
  category: ItemCategory;
  store: StoreType;
  aisle?: string;
  brand?: BrandType;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  actualPrice?: number;
  cymbalSavings?: number;
  purchased: boolean;
  priority: PriorityLevel;
  dietaryTag?: string;
  notes?: string;
  substitutes?: {
    name: string;
    diff: string;
    priceDelta: string;
    store?: string;
    brand?: BrandType;
  }[];
}

export interface DrinkFormulaBreakdown {
  drinksPerAdult: number;
  totalDrinks: number;
  wineBottles: number;
  beerCans: number;
  sodaCans: number;
  waterBottlesOrGal: string;
  iceLbs: number;
}

export interface FoodFormulaBreakdown {
  appetizersPerPerson: number;
  mainCoursePortions: number;
  dessertServings: number;
  recommendedStyle: string;
}

export interface TimelineMilestone {
  id: string;
  phase: '1_week_before' | '3_days_before' | '1_day_before' | 'day_of_morning' | '1_hour_before' | 'during_party';
  task: string;
  completed: boolean;
  category: 'shopping' | 'prep' | 'decor' | 'chill_ice' | 'host';
}

export interface SignatureRecipe {
  name: string;
  type: 'punch' | 'cocktail' | 'mocktail' | 'dish';
  servings: number;
  ingredients: string[];
  instructions: string[];
}

export interface DietaryCounts {
  vegetarian: number;
  vegan: number;
  glutenFree: number;
  nutFree: number;
  nonAlcoholic: number;
  otherNotes: string;
}

export interface PartyPlan {
  id: string;
  title: string;
  eventType: string;
  theme: string;
  vibeDescription: string;
  guestCount: {
    adults: number;
    kids: number;
    total: number;
  };
  dietary: DietaryCounts;
  budget: {
    target: number;
    tier: 'thrifty' | 'balanced' | 'premium' | 'luxury';
    currency: string;
  };
  durationHours: number;
  venueType: 'indoor' | 'backyard' | 'park' | 'rented_venue';
  date?: string;
  shoppingList: ShoppingItem[];
  drinkFormula: DrinkFormulaBreakdown;
  foodFormula: FoodFormulaBreakdown;
  timeline: TimelineMilestone[];
  tipsAndHacks: string[];
  signatureRecipe?: SignatureRecipe;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  suggestedActions?: {
    label: string;
    actionType: string;
    payload?: any;
  }[];
  itemsToAdd?: Partial<ShoppingItem>[];
}

export interface CheckoutSummary {
  method: 'curbside' | 'delivery' | 'instore_scan';
  storeLocation: string;
  fulfillmentTime: string;
  subtotal: number;
  memberDiscounts: number;
  estimatedTax: number;
  finalTotal: number;
  itemCount: number;
}
