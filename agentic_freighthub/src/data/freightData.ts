import { PortHub, PickupDeliveryPoint, PromoCoupon, CorridorBenchmark, SavedQuotation, ContainerTrackingRecord, Incoterm } from '../types';

export interface IncotermDefinition {
  code: Incoterm;
  name: string;
  category: string;
}

export const INCOTERMS: IncotermDefinition[] = [
  { code: 'FOB', name: 'Free on Board', category: 'Port Departure' },
  { code: 'CIF', name: 'Cost, Insurance and Freight', category: 'Port Arrival' },
  { code: 'EXW', name: 'Ex Works', category: 'Factory Pickup' },
  { code: 'DDP', name: 'Delivered Duty Paid', category: 'Door-to-Door' },
  { code: 'CFR', name: 'Cost and Freight', category: 'Port Arrival' },
];

export const CARGO_TYPES = [
  'General Dry Goods',
  'Consumer Electronics & IT',
  'Apparel & Textiles',
  'Automotive & Engineering Spares',
  'Pharmaceuticals & Medical Devices',
  'Agricultural & Perishables',
  'Hazardous Chemicals (Class 3)',
  'Heavy Machinery & Capital Goods'
];

export const PORTS_AND_HUBS: PortHub[] = [
  // ── OCEAN FREIGHT: Sea Ports ──────────────────────────────────────
  {
    code: 'INNSA',
    name: 'INNSA — Nhava Sheva (Jawaharlal Nehru Port), Mumbai, India',
    city: 'Mumbai',
    country: 'India',
    type: 'sea',
    locationLabel: 'Nhava Sheva Sea Port',
    supportedModes: ['ocean'],
  },
  {
    code: 'MAA-SEA',
    name: 'MAA — Chennai Port, Tamil Nadu, India',
    city: 'Chennai',
    country: 'India',
    type: 'sea',
    locationLabel: 'Chennai Port Container Hub',
    supportedModes: ['ocean'],
  },
  {
    code: 'AEJEA',
    name: 'AEJEA — Jebel Ali Port, Dubai, UAE',
    city: 'Dubai',
    country: 'United Arab Emirates',
    type: 'sea',
    locationLabel: 'Jebel Ali Sea Gateway',
    supportedModes: ['ocean'],
  },
  {
    code: 'NLRTM',
    name: 'NLRTM — Port of Rotterdam, Netherlands',
    city: 'Rotterdam',
    country: 'Netherlands',
    type: 'sea',
    locationLabel: 'Rotterdam Europort',
    supportedModes: ['ocean'],
  },
  {
    code: 'SGSIN',
    name: 'SGSIN — Port of Singapore, Singapore',
    city: 'Singapore',
    country: 'Singapore',
    type: 'sea',
    locationLabel: 'Singapore PSA Terminal',
    supportedModes: ['ocean'],
  },
  {
    code: 'USNYC',
    name: 'USNYC — Port of New York & New Jersey, USA',
    city: 'New York',
    country: 'United States',
    type: 'sea',
    locationLabel: 'New York Container Depot',
    supportedModes: ['ocean'],
  },
  {
    code: 'LKCMB',
    name: 'LKCMB — Port of Colombo, Sri Lanka',
    city: 'Colombo',
    country: 'Sri Lanka',
    type: 'sea',
    locationLabel: 'Colombo Port Terminal',
    supportedModes: ['ocean'],
  },

  // ── AIR FREIGHT: Airports ─────────────────────────────────────────
  {
    code: 'BOM',
    name: 'BOM — Chhatrapati Shivaji Maharaj Int\'l Airport, Mumbai, India',
    city: 'Mumbai',
    country: 'India',
    type: 'air',
    locationLabel: 'Mumbai Air Cargo Terminal',
    supportedModes: ['air', 'express'],
  },
  {
    code: 'DEL',
    name: 'DEL — Indira Gandhi Int\'l Airport, New Delhi, India',
    city: 'New Delhi',
    country: 'India',
    type: 'air',
    locationLabel: 'Delhi Cargo Complex',
    supportedModes: ['air', 'express'],
  },
  {
    code: 'MAA',
    name: 'MAA — Chennai Int\'l Airport, Chennai, India',
    city: 'Chennai',
    country: 'India',
    type: 'air',
    locationLabel: 'Chennai Air Cargo Hub',
    supportedModes: ['air', 'express'],
  },
  {
    code: 'BLR',
    name: 'BLR — Kempegowda Int\'l Airport, Bengaluru, India',
    city: 'Bengaluru',
    country: 'India',
    type: 'air',
    locationLabel: 'Bengaluru Air Cargo Hub',
    supportedModes: ['air', 'express'],
  },
  {
    code: 'HYD',
    name: 'HYD — Rajiv Gandhi Int\'l Airport, Hyderabad, India',
    city: 'Hyderabad',
    country: 'India',
    type: 'air',
    locationLabel: 'Hyderabad Air Cargo Hub',
    supportedModes: ['air', 'express'],
  },
  {
    code: 'DXB',
    name: 'DXB — Dubai Int\'l Airport, UAE',
    city: 'Dubai',
    country: 'United Arab Emirates',
    type: 'air',
    locationLabel: 'Dubai Airport Cargo Gateway',
    supportedModes: ['air', 'express'],
  },
  {
    code: 'SIN',
    name: 'SIN — Singapore Changi Airport, Singapore',
    city: 'Singapore',
    country: 'Singapore',
    type: 'air',
    locationLabel: 'Changi Air Cargo Terminal',
    supportedModes: ['air', 'express'],
  },
  {
    code: 'LHR',
    name: 'LHR — London Heathrow Airport, United Kingdom',
    city: 'London',
    country: 'United Kingdom',
    type: 'air',
    locationLabel: 'Heathrow Cargo Hub',
    supportedModes: ['air', 'express'],
  },
  {
    code: 'FRA',
    name: 'FRA — Frankfurt Airport, Germany',
    city: 'Frankfurt',
    country: 'Germany',
    type: 'air',
    locationLabel: 'Frankfurt CargoCity',
    supportedModes: ['air', 'express'],
  },
  {
    code: 'AMS',
    name: 'AMS — Amsterdam Airport Schiphol, Netherlands',
    city: 'Amsterdam',
    country: 'Netherlands',
    type: 'air',
    locationLabel: 'Schiphol Cargo Hub',
    supportedModes: ['air', 'express'],
  },
  {
    code: 'JFK',
    name: 'JFK — John F. Kennedy Int\'l Airport, New York, USA',
    city: 'New York',
    country: 'United States',
    type: 'air',
    locationLabel: 'JFK Air Cargo Terminal',
    supportedModes: ['air', 'express'],
  },

  // ── GROUND & RAIL: Logistics Hubs ─────────────────────────────────
  {
    code: 'MAS',
    name: 'MAS — Chennai Central / Rail Freight Hub, Chennai, India',
    city: 'Chennai',
    country: 'India',
    type: 'ground',
    locationLabel: 'Chennai Rail Freight Hub',
    supportedModes: ['ground'],
  },
  {
    code: 'BZA',
    name: 'BZA — Vijayawada Rail Freight Hub, India',
    city: 'Vijayawada',
    country: 'India',
    type: 'ground',
    locationLabel: 'Vijayawada Rail Hub',
    supportedModes: ['ground'],
  },
  {
    code: 'SBC',
    name: 'SBC — Bengaluru Rail Freight Hub, India',
    city: 'Bengaluru',
    country: 'India',
    type: 'ground',
    locationLabel: 'Bengaluru Rail Freight Hub',
    supportedModes: ['ground'],
  },
  {
    code: 'HYB',
    name: 'HYB — Hyderabad Logistics Hub, India',
    city: 'Hyderabad',
    country: 'India',
    type: 'ground',
    locationLabel: 'Hyderabad Logistics Hub',
    supportedModes: ['ground'],
  },
  {
    code: 'DEL-RAIL',
    name: 'DEL — Delhi NCR Logistics Hub, India',
    city: 'New Delhi',
    country: 'India',
    type: 'ground',
    locationLabel: 'Delhi NCR Logistics Hub',
    supportedModes: ['ground'],
  },
  {
    code: 'MUM',
    name: 'MUM — Mumbai Logistics Hub, India',
    city: 'Mumbai',
    country: 'India',
    type: 'ground',
    locationLabel: 'Mumbai Logistics Hub',
    supportedModes: ['ground'],
  },
  {
    code: 'BLR-RAIL',
    name: 'BLR — Bengaluru Logistics Hub, India',
    city: 'Bengaluru',
    country: 'India',
    type: 'ground',
    locationLabel: 'Bengaluru Logistics Hub',
    supportedModes: ['ground'],
  },
  {
    code: 'CBE',
    name: 'CBE — Coimbatore Logistics Hub, India',
    city: 'Coimbatore',
    country: 'India',
    type: 'ground',
    locationLabel: 'Coimbatore Logistics Hub',
    supportedModes: ['ground'],
  },
  {
    code: 'AMD',
    name: 'AMD — Ahmedabad Logistics Hub, India',
    city: 'Ahmedabad',
    country: 'India',
    type: 'ground',
    locationLabel: 'Ahmedabad Logistics Hub',
    supportedModes: ['ground'],
  },
  {
    code: 'KOL',
    name: 'KOL — Kolkata Logistics Hub, India',
    city: 'Kolkata',
    country: 'India',
    type: 'ground',
    locationLabel: 'Kolkata Logistics Hub',
    supportedModes: ['ground'],
  },
];

export const PICKUP_POINTS: PickupDeliveryPoint[] = [
  {
    id: 'PK-01',
    name: 'Cargo Terminal Warehouse — Air Cargo Depot',
    category: 'pickup',
    address: 'Terminal 2 Cargo Gate, Mumbai Airport'
  },
  {
    id: 'PK-02',
    name: 'Nhava Sheva Container Freight Station (CFS)',
    category: 'pickup',
    address: 'Plot 14, JNPT Logistics Park, Navi Mumbai'
  },
  {
    id: 'PK-03',
    name: 'Bandra-Kurla Commercial Freight Depot',
    category: 'pickup',
    address: 'G Block, BKC Complex, Mumbai 400051'
  },
  {
    id: 'PK-04',
    name: 'Direct Factory Door Pickup (Delhi NCR Hub)',
    category: 'pickup',
    address: 'Phase 3 Industrial Area, Gurugram'
  }
];

export const DELIVERY_POINTS: PickupDeliveryPoint[] = [
  {
    id: 'DL-01',
    name: 'Commercial Customs Bonded Facility — Jebel Ali Freezone',
    category: 'delivery',
    address: 'Gate 4, JAFZA South, Dubai, UAE'
  },
  {
    id: 'DL-02',
    name: 'Rotterdam Free Port Warehouse Terminal',
    category: 'delivery',
    address: 'Waalthaven Z.z. 12, 3089 JH Rotterdam'
  },
  {
    id: 'DL-03',
    name: 'Dubai Logistics City Door Delivery Hub',
    category: 'delivery',
    address: 'DWC Logistics District, Dubai World Central'
  },
  {
    id: 'DL-04',
    name: 'Singapore Gateway CFS Terminal Depot',
    category: 'delivery',
    address: '15 Keppel Road, Tanjong Pagar, Singapore'
  }
];

export const PROMO_COUPONS: PromoCoupon[] = [
  {
    code: 'OCEAN15',
    title: '15% Off Ocean FCL Shipments',
    description: 'Save 15% on all 40HC and 20GP container routes from Nhava Sheva to Jebel Ali & Rotterdam.',
    validityText: 'Valid till 31 Aug 2026',
    badgeText: 'PROMO: OCEAN15',
    discountType: 'percentage',
    discountValue: 15,
    applicableMode: 'ocean'
  },
  {
    code: 'AIRFREIGHT20',
    title: 'Flat Discount Off Air Freight',
    description: 'Applies to express air cargo bookings exceeding 500 kg chargeable weight from BOM or DEL.',
    validityText: 'Valid till 15 Sep 2026',
    badgeText: 'PROMO: AIRFREIGHT20',
    discountType: 'percentage',
    discountValue: 20,
    applicableMode: 'air',
    minWeightKg: 500
  },
  {
    code: 'FIRSTSHIP',
    title: 'Zero Customs Doc Fee',
    description: 'Complimentary customs clearance paperwork filing for all first-time registered shippers.',
    validityText: 'New User Incentive',
    badgeText: 'PROMO: FIRSTSHIP',
    discountType: 'doc_free',
    discountValue: 3500
  }
];

export const BENCHMARK_CORRIDORS: CorridorBenchmark[] = [
  {
    originCode: 'INNSA (Nhava Sheva, India)',
    originName: 'Nhava Sheva Port, Mumbai',
    destinationCode: 'AEJEA (Jebel Ali, Dubai)',
    destinationName: 'Jebel Ali Freezone',
    mode: 'Ocean FCL',
    transitTime: '6–10 Days',
    rateInr: '₹ 1,92,250'
  },
  {
    originCode: 'BOM (Mumbai Airport, India)',
    originName: 'Mumbai Int\'l Air Hub',
    destinationCode: 'DXB (Dubai Airport, UAE)',
    destinationName: 'Dubai Cargo Terminal',
    mode: 'Air Cargo',
    transitTime: '2–4 Days',
    rateInr: '₹ 250 / kg'
  },
  {
    originCode: 'INNSA (Nhava Sheva, India)',
    originName: 'Nhava Sheva Port, Mumbai',
    destinationCode: 'NLRTM (Rotterdam, Netherlands)',
    destinationName: 'Port of Rotterdam',
    mode: 'Ocean FCL',
    transitTime: '24–28 Days',
    rateInr: '₹ 2,15,800'
  },
  {
    originCode: 'MAA (Chennai Port, India)',
    originName: 'Chennai Port Hub',
    destinationCode: 'SGSIN (Singapore Port)',
    destinationName: 'PSA Singapore Gateway',
    mode: 'Ocean FCL',
    transitTime: '4–6 Days',
    rateInr: '₹ 1,45,000'
  },
  {
    originCode: 'DEL (Delhi Airport, India)',
    originName: 'Indira Gandhi Air Hub',
    destinationCode: 'LHR (London Heathrow, UK)',
    destinationName: 'Heathrow Cargo Depot',
    mode: 'Express Air',
    transitTime: '1–3 Days',
    rateInr: '₹ 320 / kg'
  }
];

export const INITIAL_QUOTATIONS: SavedQuotation[] = [
  {
    id: 'QT-2026-001001',
    shipmentId: 'SHP-1001',
    shipperName: 'Aparajita De',
    shipperEmail: 'aparajita@freighthub.in',
    companyName: 'ABC Electronics Pvt Ltd',
    routeSummary: 'MAA (Chennai, India) -> NLRTM (Rotterdam, Netherlands)',
    originCode: 'MAA',
    destinationCode: 'NLRTM',
    transportMode: 'ocean',
    oceanLoadType: 'FCL',
    tariffAmount: 87000,
    currency: 'INR',
    status: 'PENDING_REVIEW',
    shipmentStatus: 'ANALYZED',
    createdAt: '2026-08-15',
    cargoSummary: '1 x 40FT Container (Consumer Electronics & IT - 5,000 KG / 12 CBM)',
    breakdown: {
      baseTariff: 70000,
      bafFuelSurcharge: 5600,
      terminalHandlingCharge: 7900,
      documentationFee: 3500,
      specialHandlingSurcharge: 0,
      insuranceFee: 0,
      discountAmount: 0,
      subtotal: 87000,
      estimatedTax: 15660,
      grandTotal: 102660,
      currency: 'INR',
      chargeBasis: 'Sea / 40FT Container (8,950 KM)',
      cargoCountSummary: '1 x 40FT',
      totalWeightKg: 5000,
      estimatedDistanceNmOrKm: '8,950 KM',
      estimatedTransitDays: '24 Days',
      estimatedArrivalDate: '2026-09-08',
      ruleBasedPriceInr: 87000,
      aiPredictedPriceInr: 85500,
      recommendedPriceInr: 86000,
      weatherRiskScore: 30,
      customsRiskScore: 40,
      routeRiskScore: 20,
      compositeRiskScore: 30,
      overallRiskLevel: 'MEDIUM'
    },
    formData: {
      originPortCode: 'MAA',
      destinationPortCode: 'NLRTM',
      pickupHubId: '',
      deliveryHubId: '',
      cargoReadyDate: '2026-08-15',
      requiredDeliveryDate: '2026-09-08',
      transportMode: 'ocean',
      oceanLoadType: 'FCL',
      incoterm: 'FOB',
      cargoItems: [
        {
          id: 'item-shp-1001',
          packageType: 'Carton',
          containerSpec: '40GP',
          quantity: 1,
          grossWeightKg: 5000,
          commodityDescription: 'Consumer Electronics & IT Assemblies',
          hsCode: '8471.30'
        }
      ],
      declaredValue: 25000,
      currency: 'INR',
      specialInstructions: 'Handle with care - Sensitive electronics cargo',
      fragileGoods: true,
      hazardousMaterials: false,
      temperatureControlled: false,
      addCargoInsurance: false,
      promoCodeApplied: null,
      fullName: 'Aparajita De',
      companyName: 'ABC Electronics Pvt Ltd',
      email: 'aparajita@freighthub.in',
      country: 'India'
    }
  },
  {
    id: 'QT-2026-00934',
    shipperName: 'Priya Sharma',
    companyName: 'Sharma Textiles',
    routeSummary: 'INNSA (Mumbai) -> AEJEA (Dubai)',
    originCode: 'INNSA',
    destinationCode: 'AEJEA',
    transportMode: 'ocean',
    oceanLoadType: 'FCL',
    tariffAmount: 384500,
    currency: 'INR',
    status: 'DRAFT',
    createdAt: '2026-08-11',
    cargoSummary: '2 x 40HC Container (Cotton Rolls)',
    breakdown: {
      baseTariff: 320000,
      bafFuelSurcharge: 25600,
      terminalHandlingCharge: 19000,
      documentationFee: 3500,
      specialHandlingSurcharge: 0,
      insuranceFee: 16400,
      discountAmount: 0,
      subtotal: 384500,
      estimatedTax: 69210,
      grandTotal: 453710,
      currency: 'INR',
      chargeBasis: 'Per Container Spec & Distance (Ocean FCL)',
      cargoCountSummary: '2 x 40HC',
      totalWeightKg: 1200,
      estimatedDistanceNmOrKm: '1,205 nm (Nautical)',
      estimatedTransitDays: '6–8 d',
      estimatedArrivalDate: '2026-08-18'
    },
    formData: {
      originPortCode: 'INNSA',
      destinationPortCode: 'AEJEA',
      pickupHubId: 'PK-02',
      deliveryHubId: 'DL-01',
      cargoReadyDate: '2026-08-11',
      requiredDeliveryDate: '2026-08-18',
      transportMode: 'ocean',
      oceanLoadType: 'FCL',
      incoterm: 'FOB',
      cargoItems: [
        {
          id: 'item-1',
          packageType: 'Pallet',
          containerSpec: '40HC',
          quantity: 2,
          grossWeightKg: 1200,
          commodityDescription: 'Cotton textile rolls, unbleached',
          hsCode: '5208.11'
        }
      ],
      declaredValue: 4500000,
      currency: 'INR',
      specialInstructions: 'Call before delivery',
      fragileGoods: false,
      hazardousMaterials: false,
      temperatureControlled: false,
      addCargoInsurance: true,
      promoCodeApplied: null,
      fullName: 'Priya Sharma',
      companyName: 'Sharma Textiles',
      email: 'priya@sharmatextiles.in',
      country: 'India'
    }
  },
  {
    id: 'QT-2026-00933',
    shipperName: 'Lars Lindqvist',
    companyName: 'Nordic Imports AB',
    routeSummary: 'INNSA (Mumbai) -> NLRTM (Rotterdam)',
    originCode: 'INNSA',
    destinationCode: 'NLRTM',
    transportMode: 'ocean',
    oceanLoadType: 'FCL',
    tariffAmount: 215800,
    currency: 'INR',
    status: 'ISSUED',
    createdAt: '2026-08-10',
    cargoSummary: '1 x 40HC Container (Industrial Pumps)',
    breakdown: {
      baseTariff: 180000,
      bafFuelSurcharge: 14400,
      terminalHandlingCharge: 9500,
      documentationFee: 3500,
      specialHandlingSurcharge: 0,
      insuranceFee: 8400,
      discountAmount: 0,
      subtotal: 215800,
      estimatedTax: 38844,
      grandTotal: 254644,
      currency: 'INR',
      chargeBasis: 'Per Container Spec & Distance (Ocean FCL)',
      cargoCountSummary: '1 x 40HC',
      totalWeightKg: 2800,
      estimatedDistanceNmOrKm: '6,350 nm (Nautical)',
      estimatedTransitDays: '24–28 d',
      estimatedArrivalDate: '2026-09-07'
    },
    formData: {
      originPortCode: 'INNSA',
      destinationPortCode: 'NLRTM',
      pickupHubId: 'PK-02',
      deliveryHubId: 'DL-02',
      cargoReadyDate: '2026-08-10',
      requiredDeliveryDate: '2026-09-07',
      transportMode: 'ocean',
      oceanLoadType: 'FCL',
      incoterm: 'CIF',
      cargoItems: [
        {
          id: 'item-2',
          packageType: 'Wooden Crate',
          containerSpec: '40HC',
          quantity: 1,
          grossWeightKg: 2800,
          commodityDescription: 'Industrial centrifugal pumps',
          hsCode: '8413.70'
        }
      ],
      declaredValue: 2400000,
      currency: 'INR',
      specialInstructions: 'Handle with crane, heavy lift required',
      fragileGoods: false,
      hazardousMaterials: false,
      temperatureControlled: false,
      addCargoInsurance: true,
      promoCodeApplied: null,
      fullName: 'Lars Lindqvist',
      companyName: 'Nordic Imports AB',
      email: 'lars@nordicimports.se',
      country: 'Netherlands'
    }
  },
  {
    id: 'QT-2026-00932',
    shipperName: 'Tariq Al-Mansoor',
    companyName: 'Gulf Machinery LLC',
    routeSummary: 'BOM (Mumbai) -> DXB (Dubai)',
    originCode: 'BOM',
    destinationCode: 'DXB',
    transportMode: 'air',
    tariffAmount: 64300,
    currency: 'INR',
    status: 'ISSUED',
    createdAt: '2026-08-08',
    cargoSummary: '250 kg Air Cargo (Spare Parts)',
    breakdown: {
      baseTariff: 50000,
      bafFuelSurcharge: 7000,
      terminalHandlingCharge: 4200,
      documentationFee: 3100,
      specialHandlingSurcharge: 0,
      insuranceFee: 0,
      discountAmount: 0,
      subtotal: 64300,
      estimatedTax: 11574,
      grandTotal: 75874,
      currency: 'INR',
      chargeBasis: 'Per Chargeable Weight (Air Freight)',
      cargoCountSummary: '250 kg Air Cargo',
      totalWeightKg: 250,
      estimatedDistanceNmOrKm: '1,920 km (Airway)',
      estimatedTransitDays: '2–4 d',
      estimatedArrivalDate: '2026-08-12'
    },
    formData: {
      originPortCode: 'BOM',
      destinationPortCode: 'DXB',
      pickupHubId: 'PK-01',
      deliveryHubId: 'DL-03',
      cargoReadyDate: '2026-08-08',
      requiredDeliveryDate: '2026-08-12',
      transportMode: 'air',
      oceanLoadType: 'FCL',
      incoterm: 'DDP',
      cargoItems: [
        {
          id: 'item-3',
          packageType: 'Carton',
          containerSpec: '20GP',
          quantity: 10,
          grossWeightKg: 250,
          commodityDescription: 'Precision turbine spare valves',
          hsCode: '8481.80'
        }
      ],
      declaredValue: 850000,
      currency: 'INR',
      specialInstructions: 'Express dispatch',
      fragileGoods: true,
      hazardousMaterials: false,
      temperatureControlled: false,
      addCargoInsurance: false,
      promoCodeApplied: null,
      fullName: 'Tariq Al-Mansoor',
      companyName: 'Gulf Machinery LLC',
      email: 'tariq@gulfmachinery.ae',
      country: 'United Arab Emirates'
    }
  }
];

export const INITIAL_TRACKING_RECORDS: ContainerTrackingRecord[] = [
  {
    trackingId: 'FH-99201',
    quoteId: 'QT-2026-00933',
    containerNo: 'TCLU-9821049',
    vesselOrFlight: 'CMA CGM MAUPASSANT / V.024N',
    carrier: 'CMA CGM Ocean Alliance',
    origin: 'INNSA — Nhava Sheva, India',
    destination: 'NLRTM — Rotterdam, Netherlands',
    status: 'IN_TRANSIT',
    statusText: 'Vessel En Route across Arabian Sea towards Suez Canal',
    eta: '2026-09-07',
    progressPercentage: 42,
    currentLocation: 'Lat: 12.8719, Lon: 51.4281 (Gulf of Aden)',
    timeline: [
      {
        title: 'Booking Confirmed & SO Issued',
        location: 'Mumbai Port CFS Depot',
        timestamp: '2026-08-10 09:30 AM',
        completed: true
      },
      {
        title: 'Customs Export Clearance Approved',
        location: 'JNPT Customs House, Nhava Sheva',
        timestamp: '2026-08-11 02:15 PM',
        completed: true
      },
      {
        title: 'Vessel Loaded & Departure',
        location: 'Nhava Sheva BMCT Berth 4',
        timestamp: '2026-08-12 06:00 AM',
        completed: true,
        current: true
      },
      {
        title: 'Suez Canal Transit Clearance',
        location: 'Port Said, Egypt',
        timestamp: 'Estimated 2026-08-22',
        completed: false
      },
      {
        title: 'Port Discharge & Door Delivery',
        location: 'Rotterdam Europort Gate 2',
        timestamp: 'Estimated 2026-09-07',
        completed: false
      }
    ]
  },
  {
    trackingId: 'FH-99202',
    quoteId: 'QT-2026-00932',
    containerNo: 'AWB-772-9102834',
    vesselOrFlight: 'EMIRATES SKYCARGO / EK-501',
    carrier: 'Emirates SkyCargo',
    origin: 'BOM — Mumbai Airport, India',
    destination: 'DXB — Dubai Airport, UAE',
    status: 'CUSTOMS_CLEARANCE',
    statusText: 'Shipment arrived at DWC Terminal. Under import customs inspection.',
    eta: '2026-08-12',
    progressPercentage: 85,
    currentLocation: 'Dubai Cargo Terminal 2 Bonded Warehouse',
    timeline: [
      {
        title: 'Airway Bill Accepted',
        location: 'BOM Cargo Terminal, Mumbai',
        timestamp: '2026-08-08 11:00 AM',
        completed: true
      },
      {
        title: 'Flight Departed Mumbai (EK-501)',
        location: 'Mumbai Int\'l Runway 27',
        timestamp: '2026-08-09 04:30 PM',
        completed: true
      },
      {
        title: 'Arrived at Dubai Int\'l Airport',
        location: 'DXB SkyCargo Facility',
        timestamp: '2026-08-09 07:10 PM',
        completed: true
      },
      {
        title: 'Import Customs Duty Clearance',
        location: 'Dubai Airport Freezone Customs',
        timestamp: '2026-08-11 10:00 AM',
        completed: true,
        current: true
      },
      {
        title: 'Out for Door Delivery',
        location: 'Dubai Commercial Hub',
        timestamp: 'Scheduled 2026-08-12',
        completed: false
      }
    ]
  }
];
