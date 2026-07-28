import { Bell, X } from 'lucide-react';
import { getDaysLeft } from '../../backend/logic/helpers';

interface NotificationCardProps {
  itemName: string;
  expiryDate: string;
  suggestion: string;
  onDismiss: () => void;
}

export function NotificationCard({
  itemName,
  expiryDate,
  suggestion,
  onDismiss,
}: NotificationCardProps) {
  const daysLeft = getDaysLeft(expiryDate);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#86A789]/10 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-[#86A789]" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-gray-900">
              Your {itemName} expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
            </p>
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{suggestion}</p>
        </div>
      </div>
    </div>
  );
}
