// Incoterm Cost Responsibility Scope Matrix (Section 3.1 & 3.2)
// Defines which charge components belong in the quote based on Incoterm rules.

export type IncotermCode = 'EXW' | 'FCA' | 'FOB' | 'CFR' | 'CIF' | 'DAP' | 'DDP';

export const INCOTERM_SCOPE: Record<IncotermCode, string[]> = {
  EXW: [],
  FCA: ['PUH', 'CCO'],
  FOB: ['PUH', 'CCO', 'THCO', 'ISPS', 'DOC'],
  CFR: ['PUH', 'CCO', 'THCO', 'ISPS', 'DOC', 'OFR', 'AFR', 'BAF', 'CAF', 'LSS', 'PSS', 'WRS'],
  CIF: ['PUH', 'CCO', 'THCO', 'ISPS', 'DOC', 'OFR', 'AFR', 'BAF', 'CAF', 'LSS', 'PSS', 'WRS', 'INS'],
  DAP: ['PUH', 'CCO', 'THCO', 'ISPS', 'DOC', 'OFR', 'AFR', 'BAF', 'CAF', 'LSS', 'PSS', 'WRS', 'INS', 'THCD', 'DLH'],
  DDP: ['PUH', 'CCO', 'THCO', 'ISPS', 'DOC', 'OFR', 'AFR', 'BAF', 'CAF', 'LSS', 'PSS', 'WRS', 'INS', 'THCD', 'DLH', 'CCD'],
};

export function filterByIncoterm(incoterm: string): string[] {
  const code = (incoterm || 'FOB').toUpperCase() as IncotermCode;
  return INCOTERM_SCOPE[code] || INCOTERM_SCOPE['FOB'];
}

export function isComponentInIncoterm(componentCode: string, incoterm: string): boolean {
  const allowed = filterByIncoterm(incoterm);
  return allowed.includes(componentCode);
}
