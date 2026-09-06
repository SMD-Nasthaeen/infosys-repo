import React from 'react';
import { Tag, Check } from 'lucide-react';
import { PROMO_COUPONS } from '../data/freightData';

interface PromotionsSectionProps {
  selectedCoupon: string | null;
  onApplyCoupon: (code: string) => void;
}

export const PromotionsSection: React.FC<PromotionsSectionProps> = ({
  selectedCoupon,
  onApplyCoupon,
}) => {
  return (
    <div id="services-section" className="bg-[#0F172A] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20">
            <Tag className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Logistics Services & Special Offers
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Comprehensive ocean, air & express services with seasonal volume discounts
            </p>
          </div>
        </div>

        <div>
          <span className="bg-amber-400 text-slate-950 font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">
            EXCLUSIVE DEALS 2026
          </span>
        </div>
      </div>

      {/* 3 Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PROMO_COUPONS.map((coupon) => {
          const isApplied = selectedCoupon === coupon.code;
          return (
            <div
              key={coupon.code}
              className={`bg-slate-900/90 border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all relative overflow-hidden ${
                isApplied
                  ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {coupon.badgeText}
                  </span>
                  <span className="text-amber-400 font-semibold">{coupon.validityText}</span>
                </div>

                <h3 className="text-base font-black text-white">{coupon.title}</h3>

                <p className="text-xs text-slate-300 leading-relaxed">{coupon.description}</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onApplyCoupon(coupon.code)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                    isApplied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                  }`}
                >
                  {isApplied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>COUPON APPLIED TO ACCOUNT</span>
                    </>
                  ) : (
                    <>
                      <Tag className="w-3.5 h-3.5" />
                      <span>Apply Offer to Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
