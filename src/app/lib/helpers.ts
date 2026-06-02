import { FoodItem, Recipe } from './types';

export function getDaysLeft(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getUrgencyColor(daysLeft: number): string {
  if (daysLeft < 2) return 'text-red-500';
  if (daysLeft < 5) return 'text-yellow-500';
  return 'text-green-500';
}

export function getUrgencyBg(daysLeft: number): string {
  if (daysLeft < 2) return 'bg-red-500/10';
  if (daysLeft < 5) return 'bg-yellow-500/10';
  return 'bg-green-500/10';
}

export function getFreshnessState(score: number): string {
  if (score >= 85) return 'Perfect for Eating';
  if (score >= 70) return 'Good Quality';
  if (score >= 50) return 'Use Soon';
  if (score >= 30) return 'Cook Today';
  return 'Past Prime';
}

export function calculateFreshnessScore(item: FoodItem): number {
  const daysLeft = getDaysLeft(item.expiryDate);
  const totalDays = Math.ceil(
    (new Date(item.expiryDate).getTime() - new Date(item.addedDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 0) return 0;
  if (totalDays <= 0) return 100;

  const scoreByDate = (daysLeft / totalDays) * 100;
  return Math.min(100, Math.max(0, scoreByDate));
}

export function getRecipeSuggestions(items: FoodItem[]): Recipe[] {
  const expiringItems = items
    .filter(item => getDaysLeft(item.expiryDate) <= 3)
    .map(item => item.name.toLowerCase());

  const allRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Banana Pancakes',
      ingredients: ['banana', 'eggs', 'milk', 'flour'],
      cookTime: '15 min',
      difficulty: 'easy',
    },
    {
      id: '2',
      name: 'Quick Veggie Stir Fry',
      ingredients: ['vegetables', 'soy sauce', 'garlic', 'rice'],
      cookTime: '20 min',
      difficulty: 'easy',
    },
    {
      id: '3',
      name: 'Creamy Pasta',
      ingredients: ['milk', 'cheese', 'pasta', 'butter'],
      cookTime: '25 min',
      difficulty: 'medium',
    },
    {
      id: '4',
      name: 'Fruit Smoothie',
      ingredients: ['banana', 'milk', 'berries', 'yogurt'],
      cookTime: '5 min',
      difficulty: 'easy',
    },
    {
      id: '5',
      name: 'Chicken Curry',
      ingredients: ['chicken', 'curry paste', 'coconut milk', 'vegetables'],
      cookTime: '35 min',
      difficulty: 'medium',
    },
    {
      id: '6',
      name: 'Tomato Soup',
      ingredients: ['tomatoes', 'onion', 'garlic', 'cream'],
      cookTime: '30 min',
      difficulty: 'easy',
    },
  ];

  // Filter recipes that use expiring ingredients
  return allRecipes
    .filter(recipe =>
      recipe.ingredients.some(ingredient =>
        expiringItems.some(item => item.includes(ingredient) || ingredient.includes(item))
      )
    )
    .slice(0, 3);
}

export function getCategoryIcon(category: FoodItem['category']): string {
  switch (category) {
    case 'dairy':
      return '🥛';
    case 'meat':
      return '🥩';
    case 'vegetables':
      return '🥬';
    case 'pantry':
      return '🍞';
    case 'canned':
      return '🥫';
    default:
      return '🍽️';
  }
}
