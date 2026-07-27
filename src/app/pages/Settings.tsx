import { useState, useEffect } from 'react';
import { Bell, ChevronRight, Lightbulb, Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../components/ui/switch';
import { store } from '../lib/store';
import { NotificationSettings } from '../lib/types';
import { requestNotificationPermission, triggerNativeNotification } from '../lib/notifications';

export default function Settings() {
  const [settings, setSettings] = useState<NotificationSettings>(store.getSettings());

  useEffect(() => {
    store.setSettings(settings);
  }, [settings]);

  const handleToggleNotifications = async () => {
    const nextState = !settings.enabled;
    if (nextState) {
      await requestNotificationPermission();
    }
    setSettings({ ...settings, enabled: nextState });
  };

  const handleLeadTimeChange = (category: keyof NotificationSettings['leadTimes']) => {
    const currentValue = settings.leadTimes[category];
    const options = [1, 2, 3, 5, 7, 14, 30];
    const currentIndex = options.indexOf(currentValue);
    const nextIndex = (currentIndex + 1) % options.length;
    
    setSettings({
      ...settings,
      leadTimes: {
        ...settings.leadTimes,
        [category]: options[nextIndex],
      },
    });
  };

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    const title = '🚨 Expiry Warning Test Alert';
    const body = 'FreshKeep: Amul Milk expires in 2 days (29/07/2026)!';

    toast.warning(title, {
      description: body,
      duration: 5000,
    });

    if (granted) {
      triggerNativeNotification(title, body);
    }
  };

  const categories = [
    { key: 'dairy' as const, label: 'Dairy', icon: '🥛', description: 'Milk, cheese, yogurt' },
    { key: 'meat' as const, label: 'Meat & Fish', icon: '🥩', description: 'Fresh protein' },
    { key: 'vegetables' as const, label: 'Produce', icon: '🥬', description: 'Fruits & vegetables' },
    { key: 'pantry' as const, label: 'Pantry Staples', icon: '🍞', description: 'Bread, grains' },
    { key: 'canned' as const, label: 'Canned Goods', icon: '🥫', description: 'Long-lasting items' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#86A789]/5 to-white pb-24">
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Customize your notifications & lead times</p>
        </div>

        {/* Notifications Toggle */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#86A789]/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#86A789]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Smart Alerts</p>
                <p className="text-sm text-gray-600">Get expiry reminders</p>
              </div>
            </div>
            <Switch checked={settings.enabled} onCheckedChange={handleToggleNotifications} />
          </div>

          {settings.enabled && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Test Notification System</span>
              <button
                onClick={handleTestNotification}
                className="px-3 py-1.5 bg-[#86A789]/10 text-[#86A789] hover:bg-[#86A789]/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                Test Alert
              </button>
            </div>
          )}
        </div>

        {/* Lead Times */}
        {settings.enabled && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Reminder Lead Times</h2>
              <p className="text-sm text-gray-600 mt-1">
                Set how many days before expiry you want to be notified
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {categories.map(({ key, label, icon, description }) => (
                <button
                  key={key}
                  onClick={() => handleLeadTimeChange(key)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-3xl">{icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#86A789]/10 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-[#86A789]">
                        {settings.leadTimes[key]} {settings.leadTimes[key] === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-600">
                💡 Tip: Tap a category to cycle through lead time options
              </p>
            </div>
          </div>
        )}

        {/* Storage Tips */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#86A789]/10 to-[#86A789]/5">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-[#86A789]" />
              <h2 className="font-semibold text-gray-900">Storage Tips</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">Keep your food fresh longer</p>
          </div>

          <div className="divide-y divide-gray-100">
            {categories.map(({ key, label, icon }) => {
              const tips: Record<string, string[]> = {
                dairy: [
                  'Store milk at 4°C or below',
                  'Keep yogurt containers sealed tightly',
                  'Wrap cheese in wax paper, then plastic'
                ],
                meat: [
                  'Keep raw meat on the bottom shelf',
                  'Use within 1-2 days or freeze',
                  'Store at 0-4°C in airtight containers'
                ],
                vegetables: [
                  'Store leafy greens in crisper drawer',
                  'Keep tomatoes at room temperature',
                  'Separate ethylene producers (bananas, apples)'
                ],
                pantry: [
                  'Keep in cool, dry place',
                  'Store bread in paper bags or bread boxes',
                  'Transfer opened items to airtight containers'
                ],
                canned: [
                  'Store in cool, dry pantry',
                  'Check for dents or rust',
                  'Use FIFO method (First In, First Out)'
                ]
              };

              return (
                <div key={key} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{icon}</span>
                    <h3 className="font-medium text-gray-900">{label}</h3>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600 ml-10">
                    {tips[key].map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-[#86A789] mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-[#86A789]/5 rounded-2xl p-4 border border-[#86A789]/20">
          <h3 className="font-medium text-gray-900 mb-2">How Smart Alerts Work</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-[#86A789] mt-0.5">•</span>
              <span>Notifications are triggered based on your category lead times</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#86A789] mt-0.5">•</span>
              <span>Get recipe suggestions using items about to expire</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#86A789] mt-0.5">•</span>
              <span>Color-coded urgency helps you prioritize what to use first</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
