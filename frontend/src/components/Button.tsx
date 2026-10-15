import React from 'react';

type Variant =
  | 'primary'
  | 'success'
  | 'danger'
  | 'neutral'
  | 'blue'
  | 'purple'
  | 'yellow'
  | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/**
 * Shared button: consistent shape, variant-based color, and sizes.
 * - Shape is always rounded, medium weight, with focus ring and disabled state.
 * - Color is controlled via `variant`.
 * - Padding via `size` (default: md).
 */
export default function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none';
  const sizes: Record<Size, string> = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-5 py-3 text-base',
  };
  const variants: Record<Variant, string> = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-300',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-300',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300',
    neutral: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-300',
    blue: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300',
    purple: 'bg-purple-500 text-white hover:bg-purple-600 focus:ring-purple-300',
    yellow: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-300',
    outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300',
  };

  return (
    <button
      {...rest}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className ?? ''}`}
    />
  );
}
