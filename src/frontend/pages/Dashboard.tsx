import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Leaf, ShoppingCart, Trash2, ChevronRight, Bell, AlertTriangle, Clock, ShieldAlert, CheckCircle, PieChart, Layers, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FreshnessGauge } from '../components/FreshnessGauge';
import { RecipeCard } from '../components/RecipeCard';
import { store } from '../../backend/storage/store';
import { FoodItem } from '../../backend/models/types';
import { calculateFreshnessScore, getRecipeSuggestions, getDaysLeft, getCategoryIcon } from '../../backend/logic/helpers';
import { checkAndNotifyExpiringItems, requestNotificationPermission } from '../../backend/services/notifications';

export default function Dashboard() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [moneySaved, setMoneySaved] = useState(0);
  const [totalValueAtRisk, setTotalValueAtRisk] = useState(0);
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [shoppingListCount, setShoppingListCount] = useState(0);
  const [wasteLogCount, setWasteLogCount] = useState(0);
  const [expiringAlerts, setExpiringAlerts] = useState<{ item: FoodItem; daysLeft: number }[]>([]);

  const loadData = () => {
    const allItems = store.getItems();
    const itemsWithFreshness = allItems.map(item => ({
      ...item,
      freshnessScore: calculateFreshnessScore(item),
    }));
    setItems(itemsWithFreshness);

    // Real-time inventory value calculations
    let inventorySum = 0;
    let riskSum = 0;
    allItems.forEach(item => {
      const price = item.price || 50;
      inventorySum += price * (item.quantity || 1);
      const days = getDaysLeft(item.expiryDate);
      if (days <= 3) {
        riskSum += price * (item.quantity || 1);
      }
    });

    setTotalInventoryValue(Math.round(inventorySum));
    setTotalValueAtRisk(Math.round(riskSum));

    // Calculate money saved in rupees
    const saved = allItems.filter(item => getDaysLeft(item.expiryDate) > 0).length * 290;
    setMoneySaved(Math.round(saved));

    // Load counts
    setShoppingListCount(store.getShoppingList().length);
    setWasteLogCount(store.getWasteLog().length);

    // Check expiring items alerts
    const alerts = checkAndNotifyExpiringItems();
    setExpiringAlerts(alerts);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkItemUsed = (id: string) => {
    store.removeItem(id);
    loadData();
  };

  const handleAddToShoppingList = (name: string) => {
    store.addToShoppingList(name);
    setShoppingListCount(store.getShoppingList().length);
  };

  // Expiry risk classification
  const criticalItems = items.filter(i => getDaysLeft(i.expiryDate) <= 2);
  const warningItems = items.filter(i => getDaysLeft(i.expiryDate) >= 3 && getDaysLeft(i.expiryDate) <= 5);
  const safeItems = items.filter(i => getDaysLeft(i.expiryDate) > 5);

  const topFreshItems = [...items]
    .sort((a, b) => b.freshnessScore - a.freshnessScore)
    .slice(0, 3);

  const recipes = getRecipeSuggestions(items);

  // Category breakdown metrics
  const categoryStats = (['dairy', 'meat', 'vegetables', 'pantry', 'canned'] as const).map(cat => {
    const catItems = items.filter(i => i.category === cat);
    const value = catItems.reduce((acc, curr) => acc + (curr.price || 50) * (curr.quantity || 1), 0);
    return {
      category: cat,
      count: catItems.length,
      value,
      icon: getCategoryIcon(cat),
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#86A789]/5 to-white pb-24 select-none">
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Real-Time Inventory & Expiry Analytics</p>
          </div>
          <button
            onClick={() => requestNotificationPermission()}
            className="p-2.5 rounded-2xl bg-white border border-gray-200 shadow-sm text-gray-700 hover:text-[#86A789] hover:border-[#86A789] transition-all"
            title="Enable Push Notifications"
          >
            <Bell className="w-5 h-5 text-[#86A789]" />
          </button>
        </div>

        {/* Expiring Items Active Alert Banner */}
        {expiringAlerts.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 border border-amber-300 rounded-3xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 text-sm">
                    {expiringAlerts.length} {expiringAlerts.length === 1 ? 'Item' : 'Items'} Expiring Soon!
                  </h2>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Alert Active
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Consume or use these items before they expire to prevent waste.
                </p>

                <div className="mt-3 space-y-2">
                  {expiringAlerts.slice(0, 3).map(({ item, daysLeft }) => (
                    <div
                      key={item.id}
                      className="bg-white/80 backdrop-blur-sm p-2.5 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{item.name}</span>
                        <span className="text-[10px] text-gray-500">({item.category})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-700">
                          {daysLeft <= 0 ? 'Expired' : `${daysLeft} day(s)`}
                        </span>
                        <button
                          onClick={() => handleMarkItemUsed(item.id)}
                          className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700"
                        >
                          Mark Used
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-Time Stats Overview Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Inventory Value</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">₹{totalInventoryValue}</p>
            <p className="text-xs text-gray-500 mt-1">{items.length} items logged</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Value at Risk</span>
            </div>
            <p className="text-2xl font-extrabold text-rose-600">₹{totalValueAtRisk}</p>
            <p className="text-xs text-gray-500 mt-1">expires in ≤ 3 days</p>
          </div>
        </div>

        {/* Real-Time Expiry Risk Status Breakdown */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#86A789]" />
              <h2 className="font-bold text-gray-900 text-base">Real-Time Expiry Status</h2>
            </div>
            <span className="text-xs font-semibold text-gray-400">{items.length} total items</span>
          </div>

          {/* Progress Bar Visual */}
          {items.length > 0 ? (
            <div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex shadow-inner mb-4">
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${(criticalItems.length / items.length) * 100}%` }}
                  title="Critical (<2 days)"
                />
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${(warningItems.length / items.length) * 100}%` }}
                  title="Warning (3-5 days)"
                />
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${(safeItems.length / items.length) * 100}%` }}
                  title="Optimal (>5 days)"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-2xl">
                  <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Critical</p>
                  <p className="text-lg font-extrabold text-rose-900 mt-0.5">{criticalItems.length}</p>
                  <p className="text-[10px] text-rose-600 mt-0.5">≤ 2 days left</p>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Warning</p>
                  <p className="text-lg font-extrabold text-amber-900 mt-0.5">{warningItems.length}</p>
                  <p className="text-[10px] text-amber-600 mt-0.5">3-5 days left</p>
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Optimal</p>
                  <p className="text-lg font-extrabold text-emerald-900 mt-0.5">{safeItems.length}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">&gt; 5 days left</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-xs font-medium">
              No items in pantry yet. Scan items to populate real-time expiry status!
            </div>
          )}
        </div>

        {/* Real-Time Food Category Distribution */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-[#86A789]" />
            <h2 className="font-bold text-gray-900 text-base">Category Inventory Distribution</h2>
          </div>

          <div className="space-y-3">
            {categoryStats.map(stat => (
              <div key={stat.category} className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div>
                    <p className="font-bold text-gray-900 text-xs capitalize">{stat.category}</p>
                    <p className="text-[10px] text-gray-500">{stat.count} {stat.count === 1 ? 'item' : 'items'}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-extrabold text-gray-900 text-xs">₹{stat.value}</p>
                  <span className="text-[10px] text-[#86A789] font-bold">
                    {items.length > 0 ? Math.round((stat.count / items.length) * 100) : 0}% of pantry
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time Scanned Items Live Timeline */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#86A789]" />
              <span>Live Pantry Expiry List</span>
            </h2>
            <Link to="/pantry" className="text-xs font-bold text-[#86A789] flex items-center gap-0.5 hover:underline">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {items.length > 0 ? (
            <div className="space-y-2.5">
              {[...items]
                .sort((a, b) => getDaysLeft(a.expiryDate) - getDaysLeft(b.expiryDate))
                .slice(0, 5)
                .map(item => {
                  const daysLeft = getDaysLeft(item.expiryDate);
                  const isUrgent = daysLeft <= 3;
                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{getCategoryIcon(item.category)}</span>
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-[10px] text-gray-500">Expires: {item.expiryDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`font-bold px-2 py-1 rounded-full text-[10px] ${
                          isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {daysLeft <= 0 ? 'Expired' : `${daysLeft} days`}
                        </span>

                        <button
                          onClick={() => handleMarkItemUsed(item.id)}
                          className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-semibold hover:bg-emerald-700"
                        >
                          Used
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-xs">
              No pantry items tracked yet.
            </div>
          )}
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
