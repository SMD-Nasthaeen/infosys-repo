import { Router, Request, Response } from 'express';
import {
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
} from '../../data/masterDataCollections';

const router = Router();

// Master Data Store in Memory (Backend Source of Truth)
const masterStore: Record<string, any[]> = {
  customers: [...INITIAL_CUSTOMERS],
  countries: [...INITIAL_COUNTRIES],
  ports: [...INITIAL_PORTS],
  tradeLanes: [...INITIAL_TRADE_LANES],
  carriers: [...INITIAL_CARRIERS],
  serviceTypes: [...INITIAL_SERVICE_TYPES],
  containerTypes: [...INITIAL_CONTAINER_TYPES],
  cargoTypes: [...INITIAL_CARGO_TYPES],
  commodities: [...INITIAL_COMMODITIES],
  packagingTypes: [...INITIAL_PACKAGING_TYPES],
  incoterms: [...INITIAL_INCOTERMS],
  chargeHeads: [...INITIAL_CHARGE_HEADS],
  currencies: [...INITIAL_CURRENCIES],
  exchangeRates: [...INITIAL_EXCHANGE_RATES],
  rateCards: [...INITIAL_RATE_CARDS_MASTER],
  surchargeRules: [...INITIAL_SURCHARGE_RULES],
  marginRules: [...INITIAL_MARGIN_RULES],
  customsTariffs: [...INITIAL_CUSTOMS_TARIFFS],
  documentTypes: [...INITIAL_DOCUMENT_TYPES],
  customerTiers: [...INITIAL_CUSTOMER_TIERS],
  masterDataAudit: [...INITIAL_MASTER_DATA_AUDIT],
};

// Normalize collection names to handle aliases
function resolveCollectionKey(name: string): string | null {
  const normalized = name.toLowerCase().replace(/[-_]/g, '');
  const mapping: Record<string, string> = {
    customer: 'customers',
    customers: 'customers',
    port: 'ports',
    ports: 'ports',
    carrier: 'carriers',
    carriers: 'carriers',
    cargotype: 'cargoTypes',
    cargotypes: 'cargoTypes',
    containertype: 'containerTypes',
    containertypes: 'containerTypes',
    tradelane: 'tradeLanes',
    tradelanes: 'tradeLanes',
    route: 'tradeLanes',
    routes: 'tradeLanes',
    commodity: 'commodities',
    commodities: 'commodities',
    incoterm: 'incoterms',
    incoterms: 'incoterms',
    country: 'countries',
    countries: 'countries',
    servicetype: 'serviceTypes',
    servicetypes: 'serviceTypes',
    packagingtype: 'packagingTypes',
    packagingtypes: 'packagingTypes',
    chargehead: 'chargeHeads',
    chargeheads: 'chargeHeads',
    currency: 'currencies',
    currencies: 'currencies',
    exchangerate: 'exchangeRates',
    exchangerates: 'exchangeRates',
    ratecard: 'rateCards',
    ratecards: 'rateCards',
    surchargerule: 'surchargeRules',
    surchargerules: 'surchargeRules',
    marginrule: 'marginRules',
    marginrules: 'marginRules',
    customstariff: 'customsTariffs',
    customstariffs: 'customsTariffs',
    documenttype: 'documentTypes',
    documenttypes: 'documentTypes',
    customertier: 'customerTiers',
    customertiers: 'customerTiers',
    masterdataaudit: 'masterDataAudit',
  };

  if (masterStore[name]) return name;
  return mapping[normalized] || null;
}

// GET /api/v1/master-data -> Full dump or summary
router.get('/', (req: Request, res: Response) => {
  const isFull = req.query.full === 'true';

  if (isFull) {
    return res.json({
      success: true,
      totalCollections: Object.keys(masterStore).length,
      data: masterStore,
    });
  }

  const summary = Object.keys(masterStore).reduce((acc, key) => {
    acc[key] = {
      count: masterStore[key].length,
      sample: masterStore[key].slice(0, 3),
    };
    return acc;
  }, {} as Record<string, any>);

  res.json({
    success: true,
    totalCollections: Object.keys(masterStore).length,
    collections: summary,
    data: masterStore,
  });
});

// POST /api/v1/master-data/reset -> Reset to default seed
router.post('/reset', (req: Request, res: Response) => {
  masterStore.customers = [...INITIAL_CUSTOMERS];
  masterStore.countries = [...INITIAL_COUNTRIES];
  masterStore.ports = [...INITIAL_PORTS];
  masterStore.tradeLanes = [...INITIAL_TRADE_LANES];
  masterStore.carriers = [...INITIAL_CARRIERS];
  masterStore.serviceTypes = [...INITIAL_SERVICE_TYPES];
  masterStore.containerTypes = [...INITIAL_CONTAINER_TYPES];
  masterStore.cargoTypes = [...INITIAL_CARGO_TYPES];
  masterStore.commodities = [...INITIAL_COMMODITIES];
  masterStore.packagingTypes = [...INITIAL_PACKAGING_TYPES];
  masterStore.incoterms = [...INITIAL_INCOTERMS];
  masterStore.chargeHeads = [...INITIAL_CHARGE_HEADS];
  masterStore.currencies = [...INITIAL_CURRENCIES];
  masterStore.exchangeRates = [...INITIAL_EXCHANGE_RATES];
  masterStore.rateCards = [...INITIAL_RATE_CARDS_MASTER];
  masterStore.surchargeRules = [...INITIAL_SURCHARGE_RULES];
  masterStore.marginRules = [...INITIAL_MARGIN_RULES];
  masterStore.customsTariffs = [...INITIAL_CUSTOMS_TARIFFS];
  masterStore.documentTypes = [...INITIAL_DOCUMENT_TYPES];
  masterStore.customerTiers = [...INITIAL_CUSTOMER_TIERS];
  masterStore.masterDataAudit = [...INITIAL_MASTER_DATA_AUDIT];

  res.json({
    success: true,
    message: 'Master Data successfully reset to standard database defaults',
    data: masterStore,
  });
});

// GET /api/v1/master-data/:collection -> List entries in a collection
router.get('/:collection', (req: Request, res: Response) => {
  const collectionKey = resolveCollectionKey(req.params.collection);

  if (!collectionKey || !masterStore[collectionKey]) {
    return res.status(404).json({
      success: false,
      error: `Collection '${req.params.collection}' not found. Valid collections: ${Object.keys(masterStore).join(', ')}`,
    });
  }

  const data = masterStore[collectionKey];
  res.json({
    success: true,
    collection: collectionKey,
    count: data.length,
    data,
  });
});

// POST /api/v1/master-data/:collection -> Add entry to backend master store
router.post('/:collection', (req: Request, res: Response) => {
  const collectionKey = resolveCollectionKey(req.params.collection);

  if (!collectionKey || !masterStore[collectionKey]) {
    return res.status(404).json({ success: false, error: `Collection '${req.params.collection}' not found` });
  }

  const data = masterStore[collectionKey];
  const newRecord = {
    _id: req.body._id || `rec-${Date.now()}`,
    ...req.body,
    createdAt: req.body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to top of collection
  data.unshift(newRecord);

  // Log to masterDataAudit
  masterStore.masterDataAudit.unshift({
    _id: `audit-${Date.now()}`,
    collectionName: collectionKey,
    recordId: newRecord._id,
    action: 'CREATE',
    changedFields: req.body,
    performedBy: 'admin_portal',
    performedAt: new Date().toISOString(),
    ipAddress: req.ip || '127.0.0.1',
  });

  res.status(201).json({
    success: true,
    message: `Record added to backend master collection '${collectionKey}'`,
    data: newRecord,
  });
});

// PUT /api/v1/master-data/:collection/:id -> Update entry in backend
router.put('/:collection/:id', (req: Request, res: Response) => {
  const collectionKey = resolveCollectionKey(req.params.collection);

  if (!collectionKey || !masterStore[collectionKey]) {
    return res.status(404).json({ success: false, error: `Collection '${req.params.collection}' not found` });
  }

  const { id } = req.params;
  const data = masterStore[collectionKey];

  const idx = data.findIndex(
    (item) =>
      item._id === id ||
      item.code === id ||
      item.customerCode === id ||
      item.unlocode === id ||
      item.laneCode === id ||
      item.carrierCode === id ||
      item.rateCardId === id
  );

  if (idx === -1) {
    // If not found, insert it as new
    const newRecord = {
      _id: id,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.unshift(newRecord);
    return res.status(201).json({
      success: true,
      message: `Record '${id}' not found, inserted new into '${collectionKey}'`,
      data: newRecord,
    });
  }

  const oldRecord = { ...data[idx] };
  data[idx] = {
    ...data[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  // Audit log
  masterStore.masterDataAudit.unshift({
    _id: `audit-${Date.now()}`,
    collectionName: collectionKey,
    recordId: id,
    action: 'UPDATE',
    changedFields: { before: oldRecord, after: data[idx] },
    performedBy: 'admin_portal',
    performedAt: new Date().toISOString(),
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: `Record '${id}' in backend collection '${collectionKey}' updated successfully`,
    data: data[idx],
  });
});

// DELETE /api/v1/master-data/:collection/:id -> Delete entry
router.delete('/:collection/:id', (req: Request, res: Response) => {
  const collectionKey = resolveCollectionKey(req.params.collection);

  if (!collectionKey || !masterStore[collectionKey]) {
    return res.status(404).json({ success: false, error: `Collection '${req.params.collection}' not found` });
  }

  const { id } = req.params;
  const data = masterStore[collectionKey];

  const idx = data.findIndex(
    (item) =>
      item._id === id ||
      item.code === id ||
      item.customerCode === id ||
      item.unlocode === id ||
      item.laneCode === id ||
      item.carrierCode === id ||
      item.rateCardId === id
  );

  if (idx === -1) {
    return res.status(404).json({ success: false, error: `Record '${id}' not found in '${collectionKey}'` });
  }

  const deletedRecord = data.splice(idx, 1)[0];

  // Audit log
  masterStore.masterDataAudit.unshift({
    _id: `audit-${Date.now()}`,
    collectionName: collectionKey,
    recordId: id,
    action: 'DELETE',
    changedFields: { deletedRecord },
    performedBy: 'admin_portal',
    performedAt: new Date().toISOString(),
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: `Record '${id}' deleted from backend collection '${collectionKey}'`,
    data: deletedRecord,
  });
});

export default router;
