import React, { useState } from 'react';
import {
  Database,
  Search,
  CheckCircle2,
  FileCode,
  Table,
  Globe,
  Truck,
  Box,
  Shield,
  DollarSign,
  Activity,
  Eye,
  X,
} from 'lucide-react';
import { useMasterData } from '../services/masterDataService';

interface CollectionGroup {
  id: string;
  name: string;
  icon: React.ElementType;
  collections: Array<{ id: string; name: string; count: number; desc: string }>;
}

export const MasterDataAdminView: React.FC = () => {
  const [activeCollection, setActiveCollection] = useState<string>('customers');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');

  const { allCollections, updateMasterRecord } = useMasterData();
  const collectionData: Record<string, any[]> = (allCollections as any) || {};

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Grouped collection navigation
  const collectionGroups: CollectionGroup[] = [
    {
      id: 'accounts',
      name: 'Customers & Accounts',
      icon: Shield,
      collections: [
        { id: 'customers', name: 'customers', count: collectionData.customers?.length || 0, desc: 'Customer Master (ABC Logistics, XYZ, etc.)' },
        { id: 'customerTiers', name: 'customerTiers', count: collectionData.customerTiers?.length || 0, desc: 'Standard, Silver, Gold, Enterprise' },
      ],
    },
    {
      id: 'geo',
      name: 'Geography & Network',
      icon: Globe,
      collections: [
        { id: 'ports', name: 'ports', count: collectionData.ports?.length || 0, desc: 'UN/LOCODE seaports (Chennai, Singapore, Dubai, Colombo, Rotterdam)' },
        { id: 'tradeLanes', name: 'tradeLanes', count: collectionData.tradeLanes?.length || 0, desc: 'Shipping & Route Data (Transit times, distances)' },
        { id: 'countries', name: 'countries', count: collectionData.countries?.length || 0, desc: 'ISO 3166-1 alpha-2 country codes' },
      ],
    },
    {
      id: 'fleet',
      name: 'Carriers & Containers',
      icon: Truck,
      collections: [
        { id: 'carriers', name: 'carriers', count: collectionData.carriers?.length || 0, desc: 'Carrier Master (ABC Shipping, XYZ Shipping, Maersk, MSC)' },
        { id: 'containerTypes', name: 'containerTypes', count: collectionData.containerTypes?.length || 0, desc: 'Container Type Master (20FT, 40FT, 40HC, 45HC)' },
        { id: 'serviceTypes', name: 'serviceTypes', count: collectionData.serviceTypes?.length || 0, desc: 'FCL, LCL, Air Gen, Express' },
      ],
    },
    {
      id: 'cargo',
      name: 'Cargo & Commodities',
      icon: Box,
      collections: [
        { id: 'cargoTypes', name: 'cargoTypes', count: collectionData.cargoTypes?.length || 0, desc: 'Cargo Type Master (Electronics, Dry Bulk, General, Reefer)' },
        { id: 'commodities', name: 'commodities', count: collectionData.commodities?.length || 0, desc: 'HS Code classification master' },
        { id: 'packagingTypes', name: 'packagingTypes', count: collectionData.packagingTypes?.length || 0, desc: 'Euro Pallet, Crates, Drums' },
        { id: 'documentTypes', name: 'documentTypes', count: collectionData.documentTypes?.length || 0, desc: 'Commercial Invoice, BL, AWB, MSDS' },
      ],
    },
    {
      id: 'pricing',
      name: 'Rates, Tariffs & Margins',
      icon: DollarSign,
      collections: [
        { id: 'rateCards', name: 'rateCards', count: collectionData.rateCards?.length || 0, desc: 'Freight Rates (Base rate cards master)' },
        { id: 'marginRules', name: 'marginRules', count: collectionData.marginRules?.length || 0, desc: 'Margin Rules (Floors by customer tier & mode)' },
        { id: 'surchargeRules', name: 'surchargeRules', count: collectionData.surchargeRules?.length || 0, desc: 'Peak season, war risk, DG surcharges' },
        { id: 'incoterms', name: 'incoterms', count: collectionData.incoterms?.length || 0, desc: 'Incoterms 2020 rules matrix' },
        { id: 'chargeHeads', name: 'chargeHeads', count: collectionData.chargeHeads?.length || 0, desc: 'OFR, BAF, THC, DOC charge catalog' },
        { id: 'currencies', name: 'currencies', count: collectionData.currencies?.length || 0, desc: 'USD, INR, EUR, AED, SGD' },
        { id: 'exchangeRates', name: 'exchangeRates', count: collectionData.exchangeRates?.length || 0, desc: 'Daily FX rates master' },
        { id: 'customsTariffs', name: 'customsTariffs', count: collectionData.customsTariffs?.length || 0, desc: 'Import duties & VAT by country' },
      ],
    },
    {
      id: 'audit',
      name: 'Governance & Audit',
      icon: Activity,
      collections: [
        { id: 'masterDataAudit', name: 'masterDataAudit', count: collectionData.masterDataAudit?.length || 0, desc: 'Admin change logs & IP history' },
      ],
    },
  ];

  const currentRecords = collectionData[activeCollection] || [];

  const filteredRecords = (currentRecords || []).filter((rec) => {
    if (!searchQuery) return true;
    const str = JSON.stringify(rec || {}).toLowerCase();
    return str.includes(searchQuery.toLowerCase());
  });

  const showNotificationMsg = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleActive = (recordId: string) => {
    const item = currentRecords.find((r) => r._id === recordId);
    if (item) {
      updateMasterRecord(activeCollection as any, recordId, { isActive: !item.isActive });
      showNotificationMsg(`Status updated and synced for record: ${recordId}`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              <span>Master Data Collections (MongoDB)</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                19 COLLECTIONS ACTIVE
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Admin-managed master data collections referenced by the FreightQuote AI quotation engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'json' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>JSON Schema</span>
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grouped Sidebar & Data Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Menu (19 Collections in 5 Groups) */}
        <div className="lg:col-span-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 p-4 space-y-4">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-2">
            COLLECTION CATEGORIES
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {collectionGroups.map((group) => {
              const IconComp = group.icon;
              return (
                <div key={group.id} className="space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-slate-300">
                    <IconComp className="w-3.5 h-3.5 text-blue-400" />
                    <span>{group.name}</span>
                  </div>

                  <div className="space-y-1 pl-2">
                    {group.collections.map((col) => {
                      const isSelected = activeCollection === col.id;
                      return (
                        <button
                          key={col.id}
                          onClick={() => {
                            setActiveCollection(col.id);
                            setSelectedRecord(null);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer border ${
                            isSelected
                              ? 'bg-blue-600/20 text-white border-blue-500/40 shadow-sm'
                              : 'bg-slate-900/50 hover:bg-slate-900 text-slate-400 border-transparent hover:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-mono">
                            <span className={isSelected ? 'text-blue-400 font-bold' : 'text-slate-500'}>`{col.name}`</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {col.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Collection Explorer */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search bar & info bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search records in \`${activeCollection}\`...`}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span>Showing:</span>
              <span className="font-mono text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {filteredRecords.length} / {currentRecords.length}
              </span>
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
              <div className="overflow-x-auto max-h-[500px]">
                {filteredRecords.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No records found matching search in <span className="font-mono text-slate-300">`{activeCollection}`</span>.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">_ID / CODE</th>
                        <th className="py-3 px-4">MAIN ATTRIBUTES</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-4 text-right">INSPECT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredRecords.map((item, idx) => {
                        const codeKey = item._id || item.code || item.unlocode || item.countryCode || item.rateCardId || item.ruleCode || `rec-${idx}`;
                        return (
                          <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-3 px-4 font-bold text-blue-400">{codeKey}</td>
                            <td className="py-3 px-4 max-w-xs truncate text-slate-300 font-sans text-[11px]">
                              {item.countryName || item.portName || item.laneCode || item.carrierName || item.label || item.hsCode || item.description || JSON.stringify(item).substring(0, 60)}
                            </td>
                            <td className="py-3 px-4">
                              {item.isActive !== undefined ? (
                                <button
                                  onClick={() => handleToggleActive(item._id)}
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans cursor-pointer ${
                                    item.isActive
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                                  }`}
                                >
                                  {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </button>
                              ) : (
                                <span className="text-slate-500 text-[10px] font-sans">SYSTEM</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedRecord(item)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors cursor-pointer"
                                title="Inspect Record Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* JSON SCHEMA VIEW */}
          {viewMode === 'json' && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[500px]">
              <pre>{JSON.stringify(filteredRecords, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      {/* INSPECTION MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white font-mono flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>Collection: `{activeCollection}` Document</span>
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 max-h-96 overflow-y-auto">
              <pre>{JSON.stringify(selectedRecord, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
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
