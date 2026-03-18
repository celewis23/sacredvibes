import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, fullWidth, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-body font-medium tracking-wide rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none'

    const variants = {
      primary:   'bg-yoga-700 text-white hover:bg-yoga-800 active:bg-yoga-900 focus-visible:ring-yoga-600 shadow-sm',
      secondary: 'bg-yoga-100 text-yoga-800 hover:bg-yoga-200 active:bg-yoga-300 focus-visible:ring-yoga-400',
      outline:   'border border-yoga-300 text-yoga-700 bg-transparent hover:bg-yoga-50 active:bg-yoga-100 focus-visible:ring-yoga-400',
      ghost:     'text-yoga-700 bg-transparent hover:bg-yoga-50 active:bg-yoga-100 focus-visible:ring-yoga-400',
      danger:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',
    }

    const sizes = {
      sm:  'px-3 py-1.5 text-sm',
      md:  'px-5 py-2.5 text-sm',
      lg:  'px-6 py-3 text-base',
      xl:  'px-8 py-4 text-base',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {isLoading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
