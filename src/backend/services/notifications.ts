import { toast } from 'sonner';
import { store } from '../storage/store';
import { FoodItem } from '../models/types';
import { getDaysLeft } from '../logic/helpers';

// Request browser web notification permissions
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    toast.error('Browser does not support desktop notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Expiry notification alerts enabled!');
      return true;
    }
  }

  toast.warning('Notification permission denied. In-app alerts will be used.');
  return false;
}

// Trigger native browser notification
export function triggerNativeNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    } catch (e) {
      console.error('Failed to show native notification:', e);
    }
  }
}

// Check all items and trigger alerts for items expiring within category lead times
export function checkAndNotifyExpiringItems(): { item: FoodItem; daysLeft: number }[] {
  const items = store.getItems();
  const settings = store.getSettings();

  if (!settings.enabled) return [];

  const expiringItems: { item: FoodItem; daysLeft: number }[] = [];

  items.forEach(item => {
    const daysLeft = getDaysLeft(item.expiryDate);
    const categoryLeadTime = settings.leadTimes[item.category] ?? 3;

    // Notify if item is within lead time or already expired
    if (daysLeft <= categoryLeadTime) {
      expiringItems.push({ item, daysLeft });

      const title = daysLeft < 0 
        ? `🚨 Expired: ${item.name}` 
        : daysLeft === 0 
          ? `⚠️ Expires Today: ${item.name}` 
          : `🔔 Expiry Warning: ${item.name}`;

      const message = daysLeft < 0 
        ? `${item.name} expired ${Math.abs(daysLeft)} day(s) ago! Consider logging as waste or discarding.` 
        : daysLeft === 0 
          ? `${item.name} expires TODAY! Use it now.` 
          : `${item.name} expires in ${daysLeft} day(s) (${item.expiryDate}).`;

      // Show in-app sonner toast
      if (daysLeft <= 1) {
        toast.error(title, { description: message, duration: 6000 });
      } else {
        toast.warning(title, { description: message, duration: 5000 });
      }

      // Native browser popup
      triggerNativeNotification(title, message);
    }
  });

  return expiringItems;
}

// Notify immediately when a user scans and adds an item
export function notifyItemAddedWithExpiry(item: FoodItem) {
  const daysLeft = getDaysLeft(item.expiryDate);
  const settings = store.getSettings();
  const leadTime = settings.leadTimes[item.category] ?? 3;

  const successMessage = `Added ${item.name} (Expires on ${item.expiryDate})`;
  const notificationDetails = `Alert scheduled ${leadTime} day(s) before expiry. (${daysLeft} days remaining)`;

  toast.success(successMessage, {
    description: notificationDetails,
    duration: 4000,
  });

  if (daysLeft <= leadTime) {
    const title = `⚠️ Expiry Warning: ${item.name}`;
    const body = `${item.name} is expiring soon (in ${daysLeft} days)!`;
    triggerNativeNotification(title, body);
  }
}
