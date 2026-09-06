import React from 'react';

interface MoneyProps {
  amount: string | number;
  currency?: string;
  className?: string;
}

export const Money: React.FC<MoneyProps> = ({ amount, currency = 'INR', className = '' }) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  const formatted = isNaN(num)
    ? '0.00'
    : num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'AED' ? 'AED ' : '₹';

  return (
    <span className={`font-mono ${className}`}>
      {symbol}{formatted}
    </span>
  );
};
