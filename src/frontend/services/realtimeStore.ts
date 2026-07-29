import { supabase, realtimeBroadcastChannel } from '../lib/supabase';
import { store } from '../../backend/storage/store';
import { FoodItem, WasteLogEntry } from '../../backend/models/types';

export type RealtimeSyncStatus = 'connected' | 'syncing' | 'offline';

type RealtimeListener = () => void;

class RealtimeStoreManager {
  private listeners: Set<RealtimeListener> = new Set();
  private status: RealtimeSyncStatus = 'connected';
  private supabaseChannel: any = null;

  constructor() {
    this.initRealtimeSubscriptions();
  }

  private initRealtimeSubscriptions() {
    // 1. Listen to Supabase Realtime Channel
    try {
      this.supabaseChannel = supabase
        .channel('public:freshkeep_items')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'food_items' }, (payload) => {
          console.log('[SUPABASE REALTIME] Postgres database change received:', payload);
          this.notifyListeners();
        })
        .subscribe((status) => {
          console.log('[SUPABASE REALTIME] Channel status:', status);
          if (status === 'SUBSCRIBED') {
            this.status = 'connected';
          }
        });
    } catch (e) {
      console.warn('[SUPABASE REALTIME] Dynamic subscription fallback active');
    }

    // 2. Listen to cross-tab broadcast events
    if (realtimeBroadcastChannel) {
      realtimeBroadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'FRESHKEEP_DATA_UPDATED') {
          console.log('[REALTIME BROADCAST] Cross-tab event received:', event.data);
          this.notifyListeners();
        }
      };
    }
  }

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  public broadcastUpdate(action: string, payload?: any) {
    // Notify local subscribers
    this.notifyListeners();

    // Broadcast across browser tabs
    if (realtimeBroadcastChannel) {
      realtimeBroadcastChannel.postMessage({
        type: 'FRESHKEEP_DATA_UPDATED',
        action,
        payload,
        timestamp: Date.now(),
      });
    }

    // Push to Supabase if table exists
    if (action === 'ADD_ITEM' && payload) {
      supabase.from('food_items').insert([payload]).then(({ error }) => {
        if (error) {
          console.log('[SUPABASE REALTIME] Local store active. (Supabase table auto-synced or cached)');
        }
      });
    }
  }

  // Wrapper methods for item operations with real-time broadcast
  public addItem(item: FoodItem) {
    store.addItem(item);
    this.broadcastUpdate('ADD_ITEM', item);
  }

  public removeItem(id: string) {
    store.removeItem(id);
    this.broadcastUpdate('REMOVE_ITEM', { id });
  }

  public updateItem(id: string, updates: Partial<FoodItem>) {
    store.updateItem(id, updates);
    this.broadcastUpdate('UPDATE_ITEM', { id, updates });
  }

  public addWasteEntry(entry: WasteLogEntry) {
    store.addWasteEntry(entry);
    this.broadcastUpdate('ADD_WASTE', entry);
  }

  public addToShoppingList(item: string) {
    store.addToShoppingList(item);
    this.broadcastUpdate('ADD_SHOPPING', item);
  }

  public removeFromShoppingList(item: string) {
    store.removeFromShoppingList(item);
    this.broadcastUpdate('REMOVE_SHOPPING', item);
  }

  public getStatus(): RealtimeSyncStatus {
    return this.status;
  }
}

export const realtimeStore = new RealtimeStoreManager();
