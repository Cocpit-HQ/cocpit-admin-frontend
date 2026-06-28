import React from 'react';

export const Input = ({
  label,
  id,
  type = 'text',
  error,
  className = '',
  required = false,
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-on-surface-variant font-title">
          {label} {required && <span className="text-error font-body-sm">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        required={required}
        className={`w-full px-4 py-2.5 rounded-xl border bg-surface text-on-surface text-sm transition-all focus:outline-none focus:ring-2 ${
          error
            ? 'border-error focus:ring-error/20 focus:border-error'
            : 'border-outline focus:ring-primary/20 focus:border-primary'
        }`}
        {...props}
      />
      {error && (
        <span className="text-xs font-medium text-error font-body-sm animate-fade-in">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
