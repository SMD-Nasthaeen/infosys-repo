import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Users,
  Anchor,
  Truck,
  Box,
  Route as RouteIcon,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  Check,
  X,
  Sparkles,
  Eye,
  Building,
  Ship,
  Layers,
  ArrowRight,
  Database,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import {
  Customer,
  Port,
  Carrier,
  CargoType,
  TradeLane,
} from '../data/masterDataCollections';
import { useMasterData } from '../services/masterDataService';

export type MasterSection = 'customers' | 'ports' | 'carriers' | 'cargoTypes' | 'routes';

interface AdminSetupMasterConsoleProps {
  initialSection?: MasterSection;
  onNavigateToQuoteTest?: () => void;
}

export const AdminSetupMasterConsole: React.FC<AdminSetupMasterConsoleProps> = ({
  initialSection = 'customers',
  onNavigateToQuoteTest
}) => {
  const [activeSection, setActiveSection] = useState<MasterSection>(initialSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Unified Master Data State & Live Persistence
  const {
    customers,
    ports,
    carriers,
    cargoTypes,
    tradeLanes,
    addMasterRecord,
    updateMasterRecord,
    deleteMasterRecord,
    resetMasterData,
  } = useMasterData();

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [inspectItem, setInspectItem] = useState<any | null>(null);

  // Form States
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({
    customerCode: 'C005',
    companyName: 'ABC Logistics',
    contactName: 'Rajesh Sharma',
    email: 'ops@abclogistics.com',
    phone: '+91 44 2836 1100',
    tier: 'GOLD',
    primaryHub: 'Chennai (INMAA)',
    defaultPaymentTerms: 'Net 30',
    isActive: true,
  });

  const [portForm, setPortForm] = useState<Partial<Port>>({
    unlocode: 'INMAA',
    portName: 'Chennai Port',
    portType: 'SEAPORT',
    city: 'Chennai',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    terminals: ['CCTL', 'CITPL'],
    customsOffice: 'INMAA1',
    avgDwellTimeHrs: 48,
    congestionIndex: 0.35,
    isActive: true,
  });

  const [carrierForm, setCarrierForm] = useState<Partial<Carrier>>({
    carrierCode: 'ABCS',
    carrierName: 'ABC Shipping',
    mode: 'OCEAN',
    serviceTypes: ['FCL', 'LCL', 'Direct Express'],
    reliabilityScore: 95,
    contractTier: 'CONTRACT',
    apiEnabled: true,
    contactEmail: 'lineops@abcshipping.example',
    isActive: true,
  });

  const [cargoTypeForm, setCargoTypeForm] = useState<Partial<CargoType>>({
    code: 'GEN',
    label: 'General Cargo',
    isHazardous: false,
    imoClass: null,
    requiresTempControl: false,
    handlingSurchargePct: 0,
    restrictedCountries: [],
    isActive: true,
  });

  const [routeForm, setRouteForm] = useState<Partial<TradeLane>>({
    laneCode: 'INMAA-SGSIN-OCEAN',
    originPortCode: 'INMAA',
    destPortCode: 'SGSIN',
    mode: 'OCEAN',
    distanceNm: 1560,
    baseTransitDays: 6,
    transhipmentPorts: [],
    canalsCrossed: [],
    riskZones: [],
    isActive: true,
  });

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleResetToStandardExamples = () => {
    resetMasterData();
    notify('Standard master dataset restored and synchronized.');
  };

  const handleToggleActive = (id: string) => {
    if (activeSection === 'customers') {
      const c = customers.find(item => item._id === id);
      if (c) updateMasterRecord('customers', id, { isActive: !c.isActive });
    } else if (activeSection === 'ports') {
      const p = ports.find(item => item._id === id);
      if (p) updateMasterRecord('ports', id, { isActive: !p.isActive });
    } else if (activeSection === 'carriers') {
      const cr = carriers.find(item => item._id === id);
      if (cr) updateMasterRecord('carriers', id, { isActive: !cr.isActive });
    } else if (activeSection === 'cargoTypes') {
      const cg = cargoTypes.find(item => item._id === id);
      if (cg) updateMasterRecord('cargoTypes', id, { isActive: !cg.isActive });
    } else if (activeSection === 'routes') {
      const tl = tradeLanes.find(item => item._id === id);
      if (tl) updateMasterRecord('tradeLanes', id, { isActive: !tl.isActive });
    }
    notify('Record active status updated.');
  };

  const handleDelete = (id: string) => {
    if (activeSection === 'customers') {
      deleteMasterRecord('customers', id);
    } else if (activeSection === 'ports') {
      deleteMasterRecord('ports', id);
    } else if (activeSection === 'carriers') {
      deleteMasterRecord('carriers', id);
    } else if (activeSection === 'cargoTypes') {
      deleteMasterRecord('cargoTypes', id);
    } else if (activeSection === 'routes') {
      deleteMasterRecord('tradeLanes', id);
    }
    notify('Record removed from master registry.');
  };

  const handleSaveRecord = () => {
    if (activeSection === 'customers') {
      if (editingItem) {
        updateMasterRecord('customers', editingItem._id, customerForm);
        notify(`Customer "${customerForm.companyName}" updated.`);
      } else {
        const newCustomer: Customer = {
          _id: `cust-${Date.now()}`,
          customerCode: customerForm.customerCode || `C00${customers.length + 1}`,
          companyName: customerForm.companyName || 'New Customer',
          contactName: customerForm.contactName || 'Admin Contact',
          email: customerForm.email || 'contact@example.com',
          phone: customerForm.phone || '+91 44 0000 0000',
          tier: (customerForm.tier as any) || 'GOLD',
          primaryHub: customerForm.primaryHub || 'Chennai (INMAA)',
          defaultPaymentTerms: customerForm.defaultPaymentTerms || 'Net 30',
          isActive: customerForm.isActive ?? true,
        };
        addMasterRecord('customers', newCustomer);
        notify(`Customer "${newCustomer.companyName}" created.`);
      }
    } else if (activeSection === 'ports') {
      if (editingItem) {
        updateMasterRecord('ports', editingItem._id, {
          ...portForm,
          location: { type: 'Point', coordinates: [80.29, 13.09] },
        });
        notify(`Port "${portForm.portName}" updated.`);
      } else {
        const newPort: Port = {
          _id: `p-${Date.now()}`,
          unlocode: portForm.unlocode || 'INMAA',
          portName: portForm.portName || 'New Master Port',
          portType: (portForm.portType as any) || 'SEAPORT',
          city: portForm.city || 'City',
          countryCode: portForm.countryCode || 'IN',
          location: { type: 'Point', coordinates: [80.29, 13.09] },
          timezone: portForm.timezone || 'Asia/Kolkata',
          terminals: portForm.terminals || ['Terminal 1'],
          customsOffice: portForm.customsOffice || 'CUSTOMS1',
          avgDwellTimeHrs: Number(portForm.avgDwellTimeHrs) || 36,
          congestionIndex: Number(portForm.congestionIndex) || 0.25,
          isActive: portForm.isActive ?? true,
        };
        addMasterRecord('ports', newPort);
        notify(`Port "${newPort.portName}" added.`);
      }
    } else if (activeSection === 'carriers') {
      if (editingItem) {
        updateMasterRecord('carriers', editingItem._id, carrierForm);
        notify(`Carrier "${carrierForm.carrierName}" updated.`);
      } else {
        const newCarrier: Carrier = {
          _id: `car-${Date.now()}`,
          carrierCode: carrierForm.carrierCode || 'ABCS',
          carrierName: carrierForm.carrierName || 'ABC Shipping',
          mode: (carrierForm.mode as any) || 'OCEAN',
          serviceTypes: carrierForm.serviceTypes || ['FCL', 'Direct Express'],
          reliabilityScore: Number(carrierForm.reliabilityScore) || 95,
          contractTier: (carrierForm.contractTier as any) || 'CONTRACT',
          apiEnabled: carrierForm.apiEnabled ?? true,
          contactEmail: carrierForm.contactEmail || 'ops@carrier.example',
          isActive: carrierForm.isActive ?? true,
        };
        addMasterRecord('carriers', newCarrier);
        notify(`Carrier "${newCarrier.carrierName}" added.`);
      }
    } else if (activeSection === 'cargoTypes') {
      if (editingItem) {
        updateMasterRecord('cargoTypes', editingItem._id, cargoTypeForm);
        notify(`Cargo Type "${cargoTypeForm.label}" updated.`);
      } else {
        const newCargo: CargoType = {
          _id: `cg-${Date.now()}`,
          code: cargoTypeForm.code || 'GEN',
          label: cargoTypeForm.label || 'General Cargo',
          isHazardous: cargoTypeForm.isHazardous ?? false,
          imoClass: cargoTypeForm.imoClass || null,
          requiresTempControl: cargoTypeForm.requiresTempControl ?? false,
          handlingSurchargePct: Number(cargoTypeForm.handlingSurchargePct) || 0,
          restrictedCountries: cargoTypeForm.restrictedCountries || [],
          isActive: cargoTypeForm.isActive ?? true,
        };
        addMasterRecord('cargoTypes', newCargo);
        notify(`Cargo Type "${newCargo.label}" added.`);
      }
    } else if (activeSection === 'routes') {
      if (editingItem) {
        updateMasterRecord('tradeLanes', editingItem._id, routeForm);
        notify(`Route "${routeForm.laneCode}" updated.`);
      } else {
        const newRoute: TradeLane = {
          _id: `tl-${Date.now()}`,
          laneCode: routeForm.laneCode || `${routeForm.originPortCode || 'INMAA'}-${routeForm.destPortCode || 'SGSIN'}-${routeForm.mode || 'OCEAN'}`,
          originPortCode: routeForm.originPortCode || 'INMAA',
          destPortCode: routeForm.destPortCode || 'SGSIN',
          mode: (routeForm.mode as any) || 'OCEAN',
          distanceNm: Number(routeForm.distanceNm) || 1500,
          baseTransitDays: Number(routeForm.baseTransitDays) || 7,
          transhipmentPorts: routeForm.transhipmentPorts || [],
          canalsCrossed: routeForm.canalsCrossed || [],
          riskZones: routeForm.riskZones || [],
          isActive: routeForm.isActive ?? true,
        };
        addMasterRecord('tradeLanes', newRoute);
        notify(`Route "${newRoute.laneCode}" added.`);
      }
    }

    setIsAddModalOpen(false);
    setEditingItem(null);
  };

  const openAddModal = () => {
    setEditingItem(null);
    if (activeSection === 'customers') {
      setCustomerForm({
        customerCode: `C00${customers.length + 1}`,
        companyName: 'ABC Logistics',
        contactName: 'Rajesh Sharma',
        email: 'ops@abclogistics.com',
        phone: '+91 44 2836 1100',
        tier: 'GOLD',
        primaryHub: 'Chennai (INMAA)',
        defaultPaymentTerms: 'Net 30',
        isActive: true,
      });
    } else if (activeSection === 'ports') {
      setPortForm({
        unlocode: 'INMAA',
        portName: 'Chennai Port',
        portType: 'SEAPORT',
        city: 'Chennai',
        countryCode: 'IN',
        timezone: 'Asia/Kolkata',
        terminals: ['CCTL', 'CITPL'],
        customsOffice: 'INMAA1',
        avgDwellTimeHrs: 48,
        congestionIndex: 0.35,
        isActive: true,
      });
    } else if (activeSection === 'carriers') {
      setCarrierForm({
        carrierCode: 'ABCS',
        carrierName: 'ABC Shipping',
        mode: 'OCEAN',
        serviceTypes: ['FCL', 'LCL', 'Direct Express'],
        reliabilityScore: 96,
        contractTier: 'CONTRACT',
        apiEnabled: true,
        contactEmail: 'lineops@abcshipping.example',
        isActive: true,
      });
    } else if (activeSection === 'cargoTypes') {
      setCargoTypeForm({
        code: 'GEN',
        label: 'General Cargo',
        isHazardous: false,
        imoClass: null,
        requiresTempControl: false,
        handlingSurchargePct: 0,
        restrictedCountries: [],
        isActive: true,
      });
    } else if (activeSection === 'routes') {
      setRouteForm({
        laneCode: 'INMAA-SGSIN-OCEAN',
        originPortCode: 'INMAA',
        destPortCode: 'SGSIN',
        mode: 'OCEAN',
        distanceNm: 1560,
        baseTransitDays: 6,
        transhipmentPorts: [],
        canalsCrossed: [],
        riskZones: [],
        isActive: true,
      });
    }
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    if (activeSection === 'customers') {
      setCustomerForm({ ...item });
    } else if (activeSection === 'ports') {
      setPortForm({ ...item });
    } else if (activeSection === 'carriers') {
      setCarrierForm({ ...item });
    } else if (activeSection === 'cargoTypes') {
      setCargoTypeForm({ ...item });
    } else if (activeSection === 'routes') {
      setRouteForm({ ...item });
    }
    setIsAddModalOpen(true);
  };

  const masterTabs = [
    {
      id: 'customers' as MasterSection,
      name: 'Customers',
      icon: Users,
      count: customers.length,
      color: 'purple',
    },
    {
      id: 'ports' as MasterSection,
      name: 'Ports & Hubs',
      icon: Anchor,
      count: ports.length,
      color: 'blue',
    },
    {
      id: 'carriers' as MasterSection,
      name: 'Carriers',
      icon: Ship,
      count: carriers.length,
      color: 'emerald',
    },
    {
      id: 'cargoTypes' as MasterSection,
      name: 'Cargo Types',
      icon: Box,
      count: cargoTypes.length,
      color: 'amber',
    },
    {
      id: 'routes' as MasterSection,
      name: 'Routes / Lanes',
      icon: RouteIcon,
      count: tradeLanes.length,
      color: 'cyan',
    },
  ];

  // Active section metadata
  const currentTab = masterTabs.find(t => t.id === activeSection)!;

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return (customers || []).filter(c => !q || JSON.stringify(c || {}).toLowerCase().includes(q));
  }, [customers, searchQuery]);

  const filteredPorts = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return (ports || []).filter(p => !q || JSON.stringify(p || {}).toLowerCase().includes(q));
  }, [ports, searchQuery]);

  const filteredCarriers = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return (carriers || []).filter(c => !q || JSON.stringify(c || {}).toLowerCase().includes(q));
  }, [carriers, searchQuery]);

  const filteredCargoTypes = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return (cargoTypes || []).filter(cg => !q || JSON.stringify(cg || {}).toLowerCase().includes(q));
  }, [cargoTypes, searchQuery]);

  const filteredRoutes = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return (tradeLanes || []).filter(t => !q || JSON.stringify(t || {}).toLowerCase().includes(q));
  }, [tradeLanes, searchQuery]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* 1. COMPACT TOP HEADER STRIP */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-400/30 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white tracking-tight">Admin Setup Master Console</h2>
              <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full font-bold border border-purple-800">
                5 Core Masters
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Governs Customers, Ports, Carriers, Cargo & Shipping Routes synced with User Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToStandardExamples}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-purple-500/20 cursor-pointer shadow-sm"
            title="Reset to default seed examples"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Demo Seed</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-purple-600/30 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {activeSection === 'customers' && 'Add Customer'}
              {activeSection === 'ports' && 'Add Port'}
              {activeSection === 'carriers' && 'Add Carrier'}
              {activeSection === 'cargoTypes' && 'Add Cargo Type'}
              {activeSection === 'routes' && 'Add Route'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. MASTER SECTION SEGMENTED NAVIGATION TABS */}
      <div className="p-3 bg-slate-50 border-b border-slate-200/80 shrink-0">
        <div className="grid grid-cols-5 gap-2">
          {masterTabs.map((tab, idx) => {
            const isSelected = activeSection === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSection(tab.id);
                  setSearchQuery('');
                }}
                className={`py-2 px-3 rounded-2xl flex items-center justify-between gap-2 text-left transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span className="text-xs font-extrabold truncate">{tab.name}</span>
                </div>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TOOLBAR: SEARCH & RECORD STATUS */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${currentTab.name}...`}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          {notification ? (
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{notification}</span>
            </span>
          ) : (
            <span className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Backend API Live Sync • Instant User Portal Reflection</span>
            </span>
          )}
        </div>
      </div>

      {/* 4. SCROLLABLE MASTER DATA TABLE (HEIGHT CONSTRAINED TO FIT IN ONE SCREEN) */}
      <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
        {/* CUSTOMER MASTER TABLE */}
        {activeSection === 'customers' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200 backdrop-blur-sm">
              <tr>
                <th className="py-2.5 px-3.5">Code</th>
                <th className="py-2.5 px-3.5">Company Name</th>
                <th className="py-2.5 px-3.5">Contact Person</th>
                <th className="py-2.5 px-3.5">Email & Phone</th>
                <th className="py-2.5 px-3.5">Tier</th>
                <th className="py-2.5 px-3.5">Primary Hub</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust._id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-2 px-3.5 font-mono font-bold text-purple-700">{cust.customerCode}</td>
                    <td className="py-2 px-3.5 font-bold text-slate-900 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[160px]">{cust.companyName}</span>
                    </td>
                    <td className="py-2 px-3.5 truncate max-w-[130px]">{cust.contactName}</td>
                    <td className="py-2 px-3.5 text-slate-500 font-mono text-[11px]">
                      <div className="truncate max-w-[150px]">{cust.email}</div>
                    </td>
                    <td className="py-2 px-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cust.tier === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                        cust.tier === 'GOLD' ? 'bg-amber-100 text-amber-800' :
                        cust.tier === 'SILVER' ? 'bg-slate-200 text-slate-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {cust.tier}
                      </span>
                    </td>
                    <td className="py-2 px-3.5 text-slate-600 truncate max-w-[120px]">{cust.primaryHub}</td>
                    <td className="py-2 px-3.5">
                      <button
                        onClick={() => handleToggleActive(cust._id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          cust.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {cust.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-2 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setInspectItem(cust)}
                          className="p-1 text-slate-400 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                          title="Inspect JSON"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(cust)}
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cust._id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* PORT MASTER TABLE */}
        {activeSection === 'ports' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200 backdrop-blur-sm">
              <tr>
                <th className="py-2.5 px-3.5">UN/LOCODE</th>
                <th className="py-2.5 px-3.5">Port Name</th>
                <th className="py-2.5 px-3.5">Type & City</th>
                <th className="py-2.5 px-3.5">Country</th>
                <th className="py-2.5 px-3.5">Customs Office</th>
                <th className="py-2.5 px-3.5">Avg Dwell</th>
                <th className="py-2.5 px-3.5">Congestion</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredPorts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    No ports found matching search.
                  </td>
                </tr>
              ) : (
                filteredPorts.map((port) => (
                  <tr key={port._id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-2 px-3.5 font-mono font-bold text-blue-700">{port.unlocode}</td>
                    <td className="py-2 px-3.5 font-bold text-slate-900 flex items-center gap-1.5">
                      <Anchor className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate max-w-[150px]">{port.portName}</span>
                    </td>
                    <td className="py-2 px-3.5 text-slate-600 truncate max-w-[120px]">
                      <span className="font-semibold">{port.portType}</span> • {port.city}
                    </td>
                    <td className="py-2 px-3.5 font-mono font-bold text-slate-800">{port.countryCode}</td>
                    <td className="py-2 px-3.5 font-mono text-slate-500 text-[11px]">{port.customsOffice}</td>
                    <td className="py-2 px-3.5 text-slate-600">{port.avgDwellTimeHrs} hrs</td>
                    <td className="py-2 px-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${port.congestionIndex > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${port.congestionIndex * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">{(port.congestionIndex * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3.5">
                      <button
                        onClick={() => handleToggleActive(port._id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          port.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {port.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-2 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setInspectItem(port)}
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Inspect JSON"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(port)}
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Port"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(port._id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* CARRIER MASTER TABLE */}
        {activeSection === 'carriers' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200 backdrop-blur-sm">
              <tr>
                <th className="py-2.5 px-3.5">Code</th>
                <th className="py-2.5 px-3.5">Carrier Name</th>
                <th className="py-2.5 px-3.5">Mode & Services</th>
                <th className="py-2.5 px-3.5">Reliability</th>
                <th className="py-2.5 px-3.5">Contract Tier</th>
                <th className="py-2.5 px-3.5">API Connect</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredCarriers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No carriers found matching search.
                  </td>
                </tr>
              ) : (
                filteredCarriers.map((carrier) => (
                  <tr key={carrier._id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-2 px-3.5 font-mono font-bold text-emerald-700">{carrier.carrierCode}</td>
                    <td className="py-2 px-3.5 font-bold text-slate-900 flex items-center gap-1.5">
                      <Ship className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[150px]">{carrier.carrierName}</span>
                    </td>
                    <td className="py-2 px-3.5 text-slate-600 truncate max-w-[160px]">
                      <span className="font-semibold text-slate-800">{carrier.mode}</span> • {carrier.serviceTypes.join(', ')}
                    </td>
                    <td className="py-2 px-3.5 font-semibold text-slate-800">{carrier.reliabilityScore}%</td>
                    <td className="py-2 px-3.5 font-bold text-slate-700">{carrier.contractTier}</td>
                    <td className="py-2 px-3.5">
                      {carrier.apiEnabled ? (
                        <span className="text-[10px] font-bold text-blue-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" /> REST/EDI
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Manual</span>
                      )}
                    </td>
                    <td className="py-2 px-3.5">
                      <button
                        onClick={() => handleToggleActive(carrier._id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          carrier.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {carrier.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-2 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setInspectItem(carrier)}
                          className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                          title="Inspect JSON"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(carrier)}
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Carrier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(carrier._id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* CARGO TYPE MASTER TABLE */}
        {activeSection === 'cargoTypes' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200 backdrop-blur-sm">
              <tr>
                <th className="py-2.5 px-3.5">Code</th>
                <th className="py-2.5 px-3.5">Cargo Description</th>
                <th className="py-2.5 px-3.5">Hazardous (IMO)</th>
                <th className="py-2.5 px-3.5">Temp Controlled</th>
                <th className="py-2.5 px-3.5">Handling Surcharge</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredCargoTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No cargo types found matching search.
                  </td>
                </tr>
              ) : (
                filteredCargoTypes.map((cargo) => (
                  <tr key={cargo._id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-2 px-3.5 font-mono font-bold text-amber-700">{cargo.code}</td>
                    <td className="py-2 px-3.5 font-bold text-slate-900 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate max-w-[180px]">{cargo.label}</span>
                    </td>
                    <td className="py-2 px-3.5">
                      {cargo.isHazardous ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          DG {cargo.imoClass || 'General'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Non-DG</span>
                      )}
                    </td>
                    <td className="py-2 px-3.5">
                      {cargo.requiresTempControl ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {cargo.tempRangeC ? `${cargo.tempRangeC.min}°C to ${cargo.tempRangeC.max}°C` : 'Reefer'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Ambient</span>
                      )}
                    </td>
                    <td className="py-2 px-3.5 font-bold text-slate-800">
                      {cargo.handlingSurchargePct > 0 ? `+${cargo.handlingSurchargePct}%` : 'Standard'}
                    </td>
                    <td className="py-2 px-3.5">
                      <button
                        onClick={() => handleToggleActive(cargo._id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          cargo.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {cargo.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-2 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setInspectItem(cargo)}
                          className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                          title="Inspect JSON"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(cargo)}
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Cargo Type"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cargo._id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* ROUTE DATA MASTER TABLE */}
        {activeSection === 'routes' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200 backdrop-blur-sm">
              <tr>
                <th className="py-2.5 px-3.5">Lane Code</th>
                <th className="py-2.5 px-3.5">Origin</th>
                <th className="py-2.5 px-3.5">Destination</th>
                <th className="py-2.5 px-3.5">Mode</th>
                <th className="py-2.5 px-3.5">Distance</th>
                <th className="py-2.5 px-3.5">Transit Time</th>
                <th className="py-2.5 px-3.5">Transshipment</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    No routes found matching search.
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((lane) => (
                  <tr key={lane._id} className="hover:bg-cyan-50/40 transition-colors">
                    <td className="py-2 px-3.5 font-mono font-bold text-cyan-700">{lane.laneCode}</td>
                    <td className="py-2 px-3.5 font-bold text-slate-900 font-mono">{lane.originPortCode}</td>
                    <td className="py-2 px-3.5 font-bold text-slate-900 font-mono">{lane.destPortCode}</td>
                    <td className="py-2 px-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {lane.mode}
                      </span>
                    </td>
                    <td className="py-2 px-3.5 font-mono text-slate-700">{lane.distanceNm} NM</td>
                    <td className="py-2 px-3.5 font-bold text-emerald-700">{lane.baseTransitDays} Days</td>
                    <td className="py-2 px-3.5 text-slate-500 font-mono truncate max-w-[140px]">
                      {lane.transhipmentPorts.length > 0 ? lane.transhipmentPorts.join(', ') : 'Direct'}
                    </td>
                    <td className="py-2 px-3.5">
                      <button
                        onClick={() => handleToggleActive(lane._id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          lane.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {lane.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-2 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setInspectItem(lane)}
                          className="p-1 text-slate-400 hover:text-cyan-700 hover:bg-cyan-100 rounded-lg transition-colors cursor-pointer"
                          title="Inspect JSON"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(lane)}
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Route"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(lane._id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. MICRO-STATUS FOOTER BAR */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600 shrink-0 font-medium">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-purple-600" />
          <span>
            Total {currentTab.name}: <strong>{currentTab.count}</strong> records configured
          </span>
        </div>
        <div className="text-slate-500 text-[10px]">
          Click status pill to toggle Active/Inactive • All changes immediately apply in User Portal
        </div>
      </div>

      {/* MODAL: ADD / EDIT MASTER RECORD */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                  {editingItem ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {editingItem ? `Edit ${currentTab.name.slice(0, -1)} Record` : `Add New ${currentTab.name.slice(0, -1)}`}
                  </h4>
                  <p className="text-[11px] text-slate-500">Master Data Configuration</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FORM BODY */}
            <div className="space-y-4">
              {/* Customer Form */}
              {activeSection === 'customers' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Customer Code *</label>
                      <input
                        type="text"
                        value={customerForm.customerCode || ''}
                        onChange={(e) => setCustomerForm({ ...customerForm, customerCode: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-purple-700 focus:bg-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Account Tier</label>
                      <select
                        value={customerForm.tier || 'GOLD'}
                        onChange={(e) => setCustomerForm({ ...customerForm, tier: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="STANDARD">Standard</option>
                        <option value="SILVER">Silver</option>
                        <option value="GOLD">Gold</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={customerForm.companyName || ''}
                      onChange={(e) => setCustomerForm({ ...customerForm, companyName: e.target.value })}
                      placeholder="e.g. ABC Logistics Ltd"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Contact Person</label>
                      <input
                        type="text"
                        value={customerForm.contactName || ''}
                        onChange={(e) => setCustomerForm({ ...customerForm, contactName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Primary Hub</label>
                      <input
                        type="text"
                        value={customerForm.primaryHub || ''}
                        onChange={(e) => setCustomerForm({ ...customerForm, primaryHub: e.target.value })}
                        placeholder="Chennai (INMAA)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Email</label>
                      <input
                        type="email"
                        value={customerForm.email || ''}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Phone</label>
                      <input
                        type="text"
                        value={customerForm.phone || ''}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Port Form */}
              {activeSection === 'ports' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">UN/LOCODE *</label>
                      <input
                        type="text"
                        value={portForm.unlocode || ''}
                        onChange={(e) => setPortForm({ ...portForm, unlocode: e.target.value.toUpperCase() })}
                        placeholder="e.g. INMAA, NLRTM"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-700 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Port Type</label>
                      <select
                        value={portForm.portType || 'SEAPORT'}
                        onChange={(e) => setPortForm({ ...portForm, portType: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="SEAPORT">Seaport Gateway</option>
                        <option value="AIRPORT">Airport Terminal</option>
                        <option value="ICD">Inland Container Depot (ICD)</option>
                        <option value="RAIL">Rail Hub</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Port Name *</label>
                    <input
                      type="text"
                      value={portForm.portName || ''}
                      onChange={(e) => setPortForm({ ...portForm, portName: e.target.value })}
                      placeholder="e.g. Chennai Port Container Gateway"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">City</label>
                      <input
                        type="text"
                        value={portForm.city || ''}
                        onChange={(e) => setPortForm({ ...portForm, city: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Country ISO</label>
                      <input
                        type="text"
                        value={portForm.countryCode || ''}
                        onChange={(e) => setPortForm({ ...portForm, countryCode: e.target.value.toUpperCase() })}
                        placeholder="IN, SG, AE, NL"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Carrier Form */}
              {activeSection === 'carriers' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Carrier Code *</label>
                      <input
                        type="text"
                        value={carrierForm.carrierCode || ''}
                        onChange={(e) => setCarrierForm({ ...carrierForm, carrierCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. ABCS, MAEU"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:bg-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Mode</label>
                      <select
                        value={carrierForm.mode || 'OCEAN'}
                        onChange={(e) => setCarrierForm({ ...carrierForm, mode: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="OCEAN">Ocean Freight</option>
                        <option value="AIR">Air Freight</option>
                        <option value="GROUND">Ground Freight</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Carrier Name *</label>
                    <input
                      type="text"
                      value={carrierForm.carrierName || ''}
                      onChange={(e) => setCarrierForm({ ...carrierForm, carrierName: e.target.value })}
                      placeholder="e.g. ABC Shipping Lines"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Reliability (%)</label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={carrierForm.reliabilityScore || 95}
                        onChange={(e) => setCarrierForm({ ...carrierForm, reliabilityScore: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Contract Tier</label>
                      <select
                        value={carrierForm.contractTier || 'CONTRACT'}
                        onChange={(e) => setCarrierForm({ ...carrierForm, contractTier: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="CONTRACT">Contract Direct</option>
                        <option value="SPOT">Spot Rate</option>
                        <option value="NVOCC">NVOCC Co-load</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Cargo Type Form */}
              {activeSection === 'cargoTypes' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Cargo Code *</label>
                      <input
                        type="text"
                        value={cargoTypeForm.code || ''}
                        onChange={(e) => setCargoTypeForm({ ...cargoTypeForm, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. GEN, ELEC, PERISH"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-amber-700 focus:bg-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Handling Surcharge (%)</label>
                      <input
                        type="number"
                        value={cargoTypeForm.handlingSurchargePct || 0}
                        onChange={(e) => setCargoTypeForm({ ...cargoTypeForm, handlingSurchargePct: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Cargo Category Label *</label>
                    <input
                      type="text"
                      value={cargoTypeForm.label || ''}
                      onChange={(e) => setCargoTypeForm({ ...cargoTypeForm, label: e.target.value })}
                      placeholder="e.g. General Cargo, Hazardous Chemicals"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cargoTypeForm.isHazardous || false}
                        onChange={(e) => setCargoTypeForm({ ...cargoTypeForm, isHazardous: e.target.checked })}
                        className="rounded text-purple-600"
                      />
                      <span>Hazardous Cargo (DG)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cargoTypeForm.requiresTempControl || false}
                        onChange={(e) => setCargoTypeForm({ ...cargoTypeForm, requiresTempControl: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span>Temperature Controlled (Reefer)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Route Form */}
              {activeSection === 'routes' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Lane Code *</label>
                    <input
                      type="text"
                      value={routeForm.laneCode || ''}
                      onChange={(e) => setRouteForm({ ...routeForm, laneCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. INMAA-SGSIN-OCEAN"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-cyan-700 focus:bg-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Origin UN/LOCODE</label>
                      <input
                        type="text"
                        value={routeForm.originPortCode || ''}
                        onChange={(e) => setRouteForm({ ...routeForm, originPortCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. INMAA"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Destination UN/LOCODE</label>
                      <input
                        type="text"
                        value={routeForm.destPortCode || ''}
                        onChange={(e) => setRouteForm({ ...routeForm, destPortCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. SGSIN"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Distance (NM)</label>
                      <input
                        type="number"
                        value={routeForm.distanceNm || 1560}
                        onChange={(e) => setRouteForm({ ...routeForm, distanceNm: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Transit Time (Days)</label>
                      <input
                        type="number"
                        value={routeForm.baseTransitDays || 6}
                        onChange={(e) => setRouteForm({ ...routeForm, baseTransitDays: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecord}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save to Master Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT JSON */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-5 space-y-3 shadow-2xl animate-in zoom-in-95 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-black font-mono flex items-center gap-2 text-purple-300">
                <FileCheck className="w-4 h-4" />
                <span>Master Schema Record Inspection</span>
              </h3>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono text-[11px] text-emerald-400 max-h-72 overflow-y-auto">
              <pre>{JSON.stringify(inspectItem, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
