import { useState, useEffect } from 'react';
import { Trash2, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react';
import { store } from '../../backend/storage/store';
import { WasteLogEntry } from '../../backend/models/types';

export default function WasteLog() {
  const [wasteLog, setWasteLog] = useState<WasteLogEntry[]>([]);
  const [totalWaste, setTotalWaste] = useState(0);
  const [monthlyWaste, setMonthlyWaste] = useState(0);

  useEffect(() => {
    loadWasteLog();
  }, []);

  const loadWasteLog = () => {
    const log = store.getWasteLog();
    setWasteLog(log);

    // Calculate total waste value
    const total = log.reduce((sum, entry) => sum + entry.estimatedValue, 0);
    setTotalWaste(total);

    // Calculate monthly waste (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthly = log
      .filter(entry => new Date(entry.wastedDate) >= thirtyDaysAgo)
      .reduce((sum, entry) => sum + entry.estimatedValue, 0);
    setMonthlyWaste(monthly);
  };

  const handleClearLog = () => {
    if (confirm('Clear all waste log entries?')) {
      store.clearWasteLog();
      loadWasteLog();
    }
  };

  const getReasonBadge = (reason: string) => {
    const styles = {
      expired: 'bg-red-100 text-red-700',
      spoiled: 'bg-orange-100 text-orange-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return styles[reason as keyof typeof styles] || styles.other;
  };

  const categoryStats = wasteLog.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + entry.estimatedValue;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#86A789]/5 to-white pb-20">
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Waste Log</h1>
            <p className="text-sm text-gray-600 mt-1">Track your food waste</p>
          </div>
          {wasteLog.length > 0 && (
            <button
              onClick={handleClearLog}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              Clear Log
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs text-gray-600">This Month</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{monthlyWaste}</p>
            <p className="text-xs text-gray-500 mt-1">wasted</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-xs text-gray-600">Total Items</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{wasteLog.length}</p>
            <p className="text-xs text-gray-500 mt-1">wasted</p>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(categoryStats).length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-[#86A789]" />
              <h2 className="font-semibold text-gray-900">Waste by Category</h2>
            </div>
            <div className="space-y-3">
              {Object.entries(categoryStats)
                .sort(([, a], [, b]) => b - a)
                .map(([category, value]) => {
                  const percentage = (value / totalWaste) * 100;
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-700">{category}</span>
                        <span className="font-medium text-gray-900">₹{value}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-[#86A789] h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Waste Log Entries */}
        {wasteLog.length > 0 ? (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900 mb-3">Recent Waste</h2>
            {wasteLog
              .sort((a, b) => new Date(b.wastedDate).getTime() - new Date(a.wastedDate).getTime())
              .map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{entry.itemName}</h3>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">
                          {entry.category}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${getReasonBadge(entry.reason)}`}>
                            {entry.reason}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.wastedDate).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="font-semibold text-red-600">₹{entry.estimatedValue}</p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-medium text-gray-900 mb-2">No waste logged! 🎉</p>
            <p className="text-sm text-gray-600">
              Keep up the good work preventing food waste
            </p>
          </div>
        )}

        {/* Tips Section */}
        {wasteLog.length > 3 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Reduce Waste Tip</p>
                <p className="text-sm text-yellow-700 mt-1">
                  You've wasted {wasteLog.length} items worth ₹{totalWaste}. Try using items before they expire by checking the "Expiring Soon" filter in your Pantry.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
