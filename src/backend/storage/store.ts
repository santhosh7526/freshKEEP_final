import { FoodItem, NotificationSettings, WasteLogEntry } from '../models/types';

const ITEMS_KEY = 'freshkeep_items';
const SETTINGS_KEY = 'freshkeep_settings';
const WASTE_LOG_KEY = 'freshkeep_waste_log';
const SHOPPING_LIST_KEY = 'freshkeep_shopping_list';

const defaultSettings: NotificationSettings = {
  enabled: true,
  leadTimes: {
    dairy: 2,
    meat: 1,
    vegetables: 3,
    pantry: 7,
    canned: 14,
  },
};

export const store = {
  getItems(): FoodItem[] {
    const data = localStorage.getItem(ITEMS_KEY);
    return data ? JSON.parse(data) : [];
  },

  setItems(items: FoodItem[]): void {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  },

  addItem(item: FoodItem): void {
    const items = this.getItems();
    items.push(item);
    this.setItems(items);
  },

  removeItem(id: string): void {
    const items = this.getItems().filter(item => item.id !== id);
    this.setItems(items);
  },

  updateItem(id: string, updates: Partial<FoodItem>): void {
    const items = this.getItems().map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    this.setItems(items);
  },

  getSettings(): NotificationSettings {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : defaultSettings;
  },

  setSettings(settings: NotificationSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  // Waste Log Functions
  getWasteLog(): WasteLogEntry[] {
    const data = localStorage.getItem(WASTE_LOG_KEY);
    return data ? JSON.parse(data) : [];
  },

  addWasteEntry(entry: WasteLogEntry): void {
    const log = this.getWasteLog();
    log.push(entry);
    localStorage.setItem(WASTE_LOG_KEY, JSON.stringify(log));
  },

  clearWasteLog(): void {
    localStorage.setItem(WASTE_LOG_KEY, JSON.stringify([]));
  },

  // Shopping List Functions
  getShoppingList(): string[] {
    const data = localStorage.getItem(SHOPPING_LIST_KEY);
    return data ? JSON.parse(data) : [];
  },

  addToShoppingList(item: string): void {
    const list = this.getShoppingList();
    if (!list.includes(item)) {
      list.push(item);
      localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(list));
    }
  },

  removeFromShoppingList(item: string): void {
    const list = this.getShoppingList().filter(i => i !== item);
    localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(list));
  },

  clearShoppingList(): void {
    localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify([]));
  },
};
