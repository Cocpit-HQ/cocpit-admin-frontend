import React from 'react';
import Spinner from './Spinner';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-95 duration-250 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
  
  const variantClasses = {
    primary: 'bg-primary text-on-primary hover:opacity-90 active:bg-primary-dark shadow-sm',
    secondary: 'bg-secondary text-on-secondary hover:opacity-90 active:bg-secondary-dark',
    outline: 'border border-outline text-on-surface hover:bg-outline/5',
    danger: 'bg-error text-on-error hover:opacity-90 active:bg-error-dark shadow-sm',
    ghost: 'text-on-surface hover:bg-outline/5 active:bg-outline/10',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" color={variant === 'primary' || variant === 'danger' ? 'white' : 'primary'} className="mr-2" />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
