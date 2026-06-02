import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Leaf, ShoppingCart, Trash2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { FreshnessGauge } from '../components/FreshnessGauge';
import { RecipeCard } from '../components/RecipeCard';
import { store } from '../lib/store';
import { FoodItem } from '../lib/types';
import { calculateFreshnessScore, getRecipeSuggestions, getDaysLeft } from '../lib/helpers';

export default function Dashboard() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [moneySaved, setMoneySaved] = useState(0);
  const [shoppingListCount, setShoppingListCount] = useState(0);
  const [wasteLogCount, setWasteLogCount] = useState(0);

  useEffect(() => {
    const loadItems = () => {
      const allItems = store.getItems();
      const itemsWithFreshness = allItems.map(item => ({
        ...item,
        freshnessScore: calculateFreshnessScore(item),
      }));
      setItems(itemsWithFreshness);

      // Calculate mock money saved (items used before expiry) in rupees
      const saved = allItems.filter(item => getDaysLeft(item.expiryDate) > 0).length * 290; // ~₹290 per item
      setMoneySaved(Math.round(saved));

      // Load shopping list and waste log counts
      setShoppingListCount(store.getShoppingList().length);
      setWasteLogCount(store.getWasteLog().length);
    };

    loadItems();
  }, []);

  const topFreshItems = items
    .sort((a, b) => b.freshnessScore - a.freshnessScore)
    .slice(0, 3);

  const recipes = getRecipeSuggestions(items);

  const wasteData = [
    { month: 'Dec', saved: 2075 },
    { month: 'Jan', saved: 3486 },
    { month: 'Feb', saved: moneySaved },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#86A789]/5 to-white pb-20">
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Your freshness overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-600">Tracked</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            <p className="text-xs text-gray-500 mt-1">items in pantry</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#86A789]/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-[#86A789]" />
              </div>
              <span className="text-xs text-gray-600">Saved</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{moneySaved}</p>
            <p className="text-xs text-gray-500 mt-1">this month</p>
          </div>
        </div>

        {/* Freshness Analysis */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-[#86A789]" />
            <h2 className="font-semibold text-gray-900">Freshness Analysis</h2>
          </div>

          {topFreshItems.length > 0 ? (
            <div className="flex justify-around items-center py-4">
              {topFreshItems.map(item => (
                <FreshnessGauge
                  key={item.id}
                  score={item.freshnessScore}
                  name={item.name}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No items to analyze yet</p>
              <p className="text-sm mt-1">Scan some items to get started!</p>
            </div>
          )}
        </div>

        {/* Waste Prevention Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Waste Prevention</h2>
          <div className="flex items-end justify-around h-32 gap-2">
            {wasteData.map((data, index) => (
              <div key={data.month} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center">
                  <span className="text-sm font-medium text-[#86A789] mb-2">
                    ₹{data.saved}
                  </span>
                  <div
                    className="w-full bg-[#86A789] rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${(data.saved / Math.max(...wasteData.map(d => d.saved))) * 100}px`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-600 mt-2">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link
            to="/shopping-list"
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <p className="font-medium text-gray-900">Shopping List</p>
            <p className="text-xs text-gray-500 mt-1">
              {shoppingListCount} {shoppingListCount === 1 ? 'item' : 'items'}
            </p>
          </Link>

          <Link
            to="/waste-log"
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <p className="font-medium text-gray-900">Waste Log</p>
            <p className="text-xs text-gray-500 mt-1">
              {wasteLogCount} {wasteLogCount === 1 ? 'entry' : 'entries'}
            </p>
          </Link>
        </div>

        {/* Recipe Suggestions */}
        {recipes.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">Recipe Suggestions</h2>
            <p className="text-sm text-gray-600 mb-4">
              Use your expiring ingredients in these delicious recipes
            </p>
            <div className="space-y-3">
              {recipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
