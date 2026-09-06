import React from 'react';
import { CustomerPortalView } from './CustomerPortalView';
import { SavedQuotation } from '../types';

interface DashboardViewProps {
  quotations: SavedQuotation[];
  onNavigateToCalculation: () => void;
  onNavigateToQuotations: () => void;
  onViewQuotePDF?: (quote: SavedQuotation) => void;
  onAddQuotation?: (quote: SavedQuotation) => void;
  onUpdateQuotation?: (quote: SavedQuotation) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  quotations,
  onNavigateToCalculation,
  onNavigateToQuotations,
  onViewQuotePDF,
  onAddQuotation,
  onUpdateQuotation,
}) => {
  return (
    <div className="space-y-6">
      <CustomerPortalView
        quotations={quotations}
        onAddQuotation={onAddQuotation}
        onUpdateQuotation={onUpdateQuotation}
        onViewQuotePDF={onViewQuotePDF}
        onOpenQuotationPdf={(quoteId) => {
          const matched = quotations.find((q) => q.id === quoteId);
          if (matched && onViewQuotePDF) {
            onViewQuotePDF(matched);
          }
        }}
        onNavigateToTab={(tab) => {
          if (tab === 'calculation') onNavigateToCalculation();
          if (tab === 'quotations') onNavigateToQuotations();
        }}
      />
    </div>
  );
};

