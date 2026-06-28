import React from 'react';

export const KPICard = ({
  title,
  value,
  growth,
  growthIcon = 'trending_up',
  icon,
  colorVariant = 'primary',
  progressWidth = '50%',
  onClick,
}) => {
  const containerColors = {
    primary: 'bg-primary-fixed text-on-primary-fixed',
    secondary: 'bg-secondary-container text-on-secondary-container',
    tertiary: 'bg-tertiary-fixed text-on-tertiary-fixed',
  };

  const barColors = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
  };

  const growthColors = {
    primary: 'text-tertiary',
    secondary: 'text-on-surface-variant',
    tertiary: 'text-tertiary',
  };

  return (
    <div
      onClick={onClick}
      className="bg-surface p-lg rounded-xl border border-outline-variant hover:border-primary transition-all group cursor-pointer"
    >
      <div className="flex justify-between items-start mb-md">
        <div className={`p-sm rounded-lg ${containerColors[colorVariant] || containerColors.primary}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className={`${growthColors[colorVariant] || growthColors.primary} font-label-md text-label-md flex items-center gap-xs`}>
          <span className="material-symbols-outlined text-body-sm">{growthIcon}</span>
          {growth}
        </span>
      </div>
      <p className="text-on-surface-variant font-label-md text-label-md">{title}</p>
      <h4 className="font-headline-md text-headline-md font-bold mt-xs">{value}</h4>
      <div className="mt-md w-full bg-surface-variant h-1 rounded-full overflow-hidden">
        <div
          className={`${barColors[colorVariant] || barColors.primary} h-full transition-all duration-700`}
          style={{ width: typeof progressWidth === 'number' ? `${progressWidth}%` : progressWidth }}
        />
      </div>
    </div>
  );
};

export default KPICard;
