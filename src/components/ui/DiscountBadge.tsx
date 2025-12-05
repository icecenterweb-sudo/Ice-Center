import React from 'react';

interface DiscountBadgeProps {
  discount: number;
  className?: string;
}

const DiscountBadge: React.FC<DiscountBadgeProps> = ({ discount, className = '' }) => {
  return (
    <span className={`bg-red-500 text-white px-2 py-0.5 rounded-lg flex items-center justify-center gap-0.5 ${className}`}>
      <span className="text-[13px] font-bold font-yekan leading-none pt-0.5">
        {discount.toLocaleString('fa-IR')}
      </span>
      <span className="text-[10px] font-light leading-none">%</span>
    </span>
  );
};

export default DiscountBadge;