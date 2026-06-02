import { useState, useEffect } from 'react';
import { Trash2, Clock, AlertCircle, DollarSign, CheckCircle } from 'lucide-react';
import { store } from '../lib/store';
import { FoodItem } from '../lib/types';
import { getDaysLeft, getUrgencyColor, getUrgencyBg, getCategoryIcon } from '../lib/helpers';

export default function Pantry() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'expiring' | 'fresh'>('all');
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    const allItems = store.getItems();
    setItems(allItems);

    // Calculate total value
    const total = allItems.reduce((sum, item) => sum + (item.price || 0), 0);
    setTotalValue(total);
  };

  const handleDelete = (id: string) => {
    store.removeItem(id);
    loadItems();
  };

  const handleMarkConsumed = (item: FoodItem) => {
    store.removeItem(item.id);
    loadItems();
  };

  const handleMarkWasted = (item: FoodItem) => {
    // Add to waste log
    store.addWasteEntry({
      id: `${Date.now()}-${Math.random()}`,
      itemName: item.name,
      category: item.category,
      wastedDate: new Date().toISOString(),
      estimatedValue: item.price || 0,
      reason: getDaysLeft(item.expiryDate) < 0 ? 'expired' : 'spoiled',
    });

    store.removeItem(item.id);
    loadItems();
  };

  const filteredItems = items
    .filter(item => {
      const daysLeft = getDaysLeft(item.expiryDate);
      if (filter === 'expiring') return daysLeft <= 5;
      if (filter === 'fresh') return daysLeft > 5;
      return true;
    })
    .sort((a, b) => {
      const daysA = getDaysLeft(a.expiryDate);
      const daysB = getDaysLeft(b.expiryDate);
      return daysA - daysB;
    });

  const expiringCount = items.filter(item => getDaysLeft(item.expiryDate) <= 5).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#86A789]/5 to-white pb-20">
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pantry List</h1>
          <p className="text-sm text-gray-600 mt-1">
            {items.length} {items.length === 1 ? 'item' : 'items'} tracked
          </p>
        </div>

        {/* Total Value Card */}
        {items.length > 0 && (
          <div className="bg-gradient-to-br from-[#86A789] to-[#6d8c70] rounded-2xl p-4 mb-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Pantry Value</p>
                <p className="text-3xl font-bold mt-1">₹{totalValue}</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
          </div>
        )}

        {/* Alert Banner */}
        {expiringCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">
                {expiringCount} {expiringCount === 1 ? 'item expires' : 'items expire'} soon
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Use them today to prevent waste!
              </p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'All Items' },
            { key: 'expiring', label: 'Expiring Soon' },
            { key: 'fresh', label: 'Fresh' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-[#86A789] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Items List */}
        {filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map(item => {
              const daysLeft = getDaysLeft(item.expiryDate);
              const isExpired = daysLeft < 0;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border transition-all hover:shadow-md ${
                    isExpired ? 'border-red-200 opacity-75' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div className="text-3xl">{getCategoryIcon(item.category)}</div>

                    {/* Item Details */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">
                        {item.category}
                        {item.quantity && item.unit && ` • ${item.quantity} ${item.unit}`}
                      </p>

                      {/* Price */}
                      {item.price && (
                        <p className="text-sm font-semibold text-[#86A789] mt-1">
                          ₹{item.price}
                        </p>
                      )}

                      {/* Countdown Timer */}
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg ${getUrgencyBg(
                            daysLeft
                          )}`}
                        >
                          <Clock className={`w-3 h-3 ${getUrgencyColor(daysLeft)}`} />
                          <span className={`text-xs font-medium ${getUrgencyColor(daysLeft)}`}>
                            {isExpired
                              ? 'Expired'
                              : daysLeft === 0
                              ? 'Today'
                              : daysLeft === 1
                              ? '1 day left'
                              : `${daysLeft} days left`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleMarkConsumed(item)}
                        className="w-10 h-10 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex items-center justify-center flex-shrink-0"
                        title="Mark as consumed"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMarkWasted(item)}
                        className="w-10 h-10 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center flex-shrink-0"
                        title="Mark as wasted"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expiry Date */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(item.expiryDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-medium text-gray-900 mb-2">No items found</p>
            <p className="text-sm text-gray-600">
              {filter === 'all'
                ? 'Start scanning items to track them'
                : `No ${filter === 'expiring' ? 'expiring' : 'fresh'} items in your pantry`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
