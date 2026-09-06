import { useState, useEffect, useCallback } from 'react';
import {
  Customer,
  Country,
  Port,
  TradeLane,
  Carrier,
  ServiceType,
  ContainerType,
  CargoType,
  Commodity,
  PackagingType,
  IncotermMaster,
  ChargeHead,
  Currency,
  ExchangeRate,
  RateCardMaster,
  SurchargeRule,
  MarginRule,
  CustomsTariff,
  DocumentType,
  CustomerTier,
  INITIAL_CUSTOMERS,
  INITIAL_COUNTRIES,
  INITIAL_PORTS,
  INITIAL_TRADE_LANES,
  INITIAL_CARRIERS,
  INITIAL_SERVICE_TYPES,
  INITIAL_CONTAINER_TYPES,
  INITIAL_CARGO_TYPES,
  INITIAL_COMMODITIES,
  INITIAL_PACKAGING_TYPES,
  INITIAL_INCOTERMS,
  INITIAL_CHARGE_HEADS,
  INITIAL_CURRENCIES,
  INITIAL_EXCHANGE_RATES,
  INITIAL_RATE_CARDS_MASTER,
  INITIAL_SURCHARGE_RULES,
  INITIAL_MARGIN_RULES,
  INITIAL_CUSTOMS_TARIFFS,
  INITIAL_DOCUMENT_TYPES,
  INITIAL_CUSTOMER_TIERS,
  INITIAL_MASTER_DATA_AUDIT,
} from '../data/masterDataCollections';

export interface MasterCollectionsState {
  customers: Customer[];
  countries: Country[];
  ports: Port[];
  tradeLanes: TradeLane[];
  carriers: Carrier[];
  serviceTypes: ServiceType[];
  containerTypes: ContainerType[];
  cargoTypes: CargoType[];
  commodities: Commodity[];
  packagingTypes: PackagingType[];
  incoterms: IncotermMaster[];
  chargeHeads: ChargeHead[];
  currencies: Currency[];
  exchangeRates: ExchangeRate[];
  rateCards: RateCardMaster[];
  surchargeRules: SurchargeRule[];
  marginRules: MarginRule[];
  customsTariffs: CustomsTariff[];
  documentTypes: DocumentType[];
  customerTiers: CustomerTier[];
  masterDataAudit: any[];
}

const STORAGE_KEY = 'freighthub_master_data_v2';
const EVENT_NAME = 'master-data-updated';

const DEFAULT_MASTER_STATE: MasterCollectionsState = {
  customers: INITIAL_CUSTOMERS,
  countries: INITIAL_COUNTRIES,
  ports: INITIAL_PORTS,
  tradeLanes: INITIAL_TRADE_LANES,
  carriers: INITIAL_CARRIERS,
  serviceTypes: INITIAL_SERVICE_TYPES,
  containerTypes: INITIAL_CONTAINER_TYPES,
  cargoTypes: INITIAL_CARGO_TYPES,
  commodities: INITIAL_COMMODITIES,
  packagingTypes: INITIAL_PACKAGING_TYPES,
  incoterms: INITIAL_INCOTERMS,
  chargeHeads: INITIAL_CHARGE_HEADS,
  currencies: INITIAL_CURRENCIES,
  exchangeRates: INITIAL_EXCHANGE_RATES,
  rateCards: INITIAL_RATE_CARDS_MASTER,
  surchargeRules: INITIAL_SURCHARGE_RULES,
  marginRules: INITIAL_MARGIN_RULES,
  customsTariffs: INITIAL_CUSTOMS_TARIFFS,
  documentTypes: INITIAL_DOCUMENT_TYPES,
  customerTiers: INITIAL_CUSTOMER_TIERS,
  masterDataAudit: INITIAL_MASTER_DATA_AUDIT,
};

// In-memory cache
let currentCache: MasterCollectionsState = loadFromStorage();

function loadFromStorage(): MasterCollectionsState {
  if (typeof window === 'undefined') return { ...DEFAULT_MASTER_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const res: MasterCollectionsState = { ...DEFAULT_MASTER_STATE };
      (Object.keys(DEFAULT_MASTER_STATE) as Array<keyof MasterCollectionsState>).forEach((k) => {
        if (Array.isArray(parsed[k])) {
          (res as any)[k] = parsed[k];
        }
      });
      return res;
    }
  } catch (err) {
    console.error('Error loading master data from localStorage:', err);
  }
  return { ...DEFAULT_MASTER_STATE };
}

function saveToStorage(state: MasterCollectionsState) {
  currentCache = state;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: state }));
    } catch (err) {
      console.error('Error saving master data to localStorage:', err);
    }
  }
}

// Initial Backend Sync on load
export async function syncWithBackend(): Promise<MasterCollectionsState> {
  try {
    const res = await fetch('/api/v1/master-data?full=true');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        // Merge backend data with local storage (preserving any local new records)
        const merged: MasterCollectionsState = { ...currentCache };
        Object.keys(json.data).forEach((key) => {
          if (Array.isArray(json.data[key])) {
            const backendList = json.data[key];
            const localList = (merged as any)[key] || [];
            // Combine unique by _id or code
            const map = new Map<string, any>();
            backendList.forEach((item: any) => {
              const id = item._id || item.code || item.customerCode || item.unlocode;
              if (id) map.set(id, item);
            });
            localList.forEach((item: any) => {
              const id = item._id || item.code || item.customerCode || item.unlocode;
              if (id) map.set(id, item);
            });
            (merged as any)[key] = Array.from(map.values());
          }
        });
        saveToStorage(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('Backend sync failed, using cached master data:', err);
  }
  return currentCache;
}

// Auto-trigger sync on initial module load
if (typeof window !== 'undefined') {
  syncWithBackend().catch(() => {});
}

// Add Record (Saves to Backend AND Local Cache)
export async function addMasterRecord<T = any>(collection: keyof MasterCollectionsState, record: Partial<T>): Promise<T> {
  const newRecord: any = {
    _id: (record as any)._id || `rec-${Date.now()}`,
    ...record,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: (record as any).isActive ?? true,
  };

  // Update local cache immediately
  const existingList = (currentCache[collection] || []) as any[];
  const updatedList = [newRecord, ...existingList.filter((item) => item._id !== newRecord._id)];
  const updatedState: MasterCollectionsState = {
    ...currentCache,
    [collection]: updatedList,
  };
  saveToStorage(updatedState);

  // Send to backend API asynchronously
  try {
    fetch(`/api/v1/master-data/${String(collection)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    }).catch((e) => console.warn(`Failed to post ${collection} to backend:`, e));
  } catch (err) {
    console.warn('Network error adding master record:', err);
  }

  return newRecord as T;
}

// Update Record (Saves to Backend AND Local Cache)
export async function updateMasterRecord<T = any>(
  collection: keyof MasterCollectionsState,
  id: string,
  updates: Partial<T>
): Promise<T | null> {
  const existingList = (currentCache[collection] || []) as any[];
  const idx = existingList.findIndex(
    (item) =>
      item._id === id ||
      item.code === id ||
      item.customerCode === id ||
      item.unlocode === id ||
      item.laneCode === id ||
      item.carrierCode === id
  );

  let updatedRecord: any = null;
  let updatedList: any[] = [];

  if (idx !== -1) {
    updatedRecord = {
      ...existingList[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    updatedList = [...existingList];
    updatedList[idx] = updatedRecord;
  } else {
    updatedRecord = {
      _id: id,
      ...updates,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updatedList = [updatedRecord, ...existingList];
  }

  const updatedState: MasterCollectionsState = {
    ...currentCache,
    [collection]: updatedList,
  };
  saveToStorage(updatedState);

  // Send to backend API
  try {
    fetch(`/api/v1/master-data/${String(collection)}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((e) => console.warn(`Failed to update ${collection}/${id} in backend:`, e));
  } catch (err) {
    console.warn('Network error updating master record:', err);
  }

  return updatedRecord as T;
}

// Delete Record
export async function deleteMasterRecord(collection: keyof MasterCollectionsState, id: string): Promise<boolean> {
  const existingList = (currentCache[collection] || []) as any[];
  const filtered = existingList.filter(
    (item) =>
      item._id !== id &&
      item.code !== id &&
      item.customerCode !== id &&
      item.unlocode !== id &&
      item.laneCode !== id &&
      item.carrierCode !== id
  );

  const updatedState: MasterCollectionsState = {
    ...currentCache,
    [collection]: filtered,
  };
  saveToStorage(updatedState);

  // Call backend
  try {
    fetch(`/api/v1/master-data/${String(collection)}/${id}`, {
      method: 'DELETE',
    }).catch((e) => console.warn(`Failed to delete ${collection}/${id} in backend:`, e));
  } catch (err) {
    console.warn('Network error deleting master record:', err);
  }

  return true;
}

// Reset Master Data to Standard Examples
export async function resetMasterDataToDefaults(): Promise<MasterCollectionsState> {
  saveToStorage(DEFAULT_MASTER_STATE);
  try {
    fetch('/api/v1/master-data/reset', { method: 'POST' }).catch(() => {});
  } catch (err) {
    console.warn('Network error resetting master data:', err);
  }
  return DEFAULT_MASTER_STATE;
}

// Synchronous Getters for any component
export function getCachedMasterData(): MasterCollectionsState {
  return currentCache;
}

// React Hook: useMasterData()
export function useMasterData() {
  const [data, setData] = useState<MasterCollectionsState>(currentCache);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setData({ ...e.detail });
      } else {
        setData(loadFromStorage());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    return () => window.removeEventListener(EVENT_NAME, handleUpdate);
  }, []);

  const add = useCallback(
    <T = any>(collection: keyof MasterCollectionsState, record: Partial<T>) => addMasterRecord(collection, record),
    []
  );

  const update = useCallback(
    <T = any>(collection: keyof MasterCollectionsState, id: string, updates: Partial<T>) =>
      updateMasterRecord(collection, id, updates),
    []
  );

  const remove = useCallback(
    (collection: keyof MasterCollectionsState, id: string) => deleteMasterRecord(collection, id),
    []
  );

  const reset = useCallback(() => resetMasterDataToDefaults(), []);

  return {
    ...data,
    allCollections: data,
    addMasterRecord: add,
    updateMasterRecord: update,
    deleteMasterRecord: remove,
    resetMasterData: reset,
  };
}
