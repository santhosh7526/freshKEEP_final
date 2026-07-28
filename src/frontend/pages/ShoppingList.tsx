import { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, X } from 'lucide-react';
import { store } from '../../backend/storage/store';

export default function ShoppingList() {
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    const list = store.getShoppingList();
    setItems(list);
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      store.addToShoppingList(newItem.trim());
      setNewItem('');
      setShowInput(false);
      loadItems();
    }
  };

  const handleRemoveItem = (item: string) => {
    store.removeFromShoppingList(item);
    loadItems();
  };

  const handleClearAll = () => {
    if (confirm('Clear all items from shopping list?')) {
      store.clearShoppingList();
      loadItems();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#86A789]/5 to-white pb-20">
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping List</h1>
            <p className="text-sm text-gray-600 mt-1">
              {items.length} {items.length === 1 ? 'item' : 'items'} to buy
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Add Item Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-[#86A789] font-medium hover:bg-[#86A789]/5 rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                placeholder="Enter item name..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#86A789] focus:border-transparent"
                autoFocus
              />
              <button
                onClick={handleAddItem}
                className="px-4 py-3 bg-[#86A789] text-white rounded-xl hover:bg-[#6d8c70] transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setShowInput(false);
                  setNewItem('');
                }}
                className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Shopping List */}
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#86A789]/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-[#86A789]" />
                  </div>
                  <p className="font-medium text-gray-900">{item}</p>
                </div>
                <button
                  onClick={() => handleRemoveItem(item)}
                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-medium text-gray-900 mb-2">No items in list</p>
            <p className="text-sm text-gray-600">
              Add items you need to buy
            </p>
          </div>
        )}

        {/* Quick Add Suggestions */}
        {items.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Add</p>
            <div className="flex flex-wrap gap-2">
              {['Milk', 'Eggs', 'Bread', 'Rice', 'Chicken', 'Vegetables'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    if (!items.includes(suggestion)) {
                      store.addToShoppingList(suggestion);
                      loadItems();
                    }
                  }}
                  disabled={items.includes(suggestion)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-[#86A789] hover:text-white hover:border-[#86A789] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
