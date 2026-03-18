import { type InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, fullWidth, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={clsx('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-sacred-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'rounded-xl border bg-white px-4 py-2.5 text-sm text-sacred-900 transition-colors',
            'placeholder:text-sacred-400',
            'focus:outline-none focus:ring-2 focus:ring-yoga-400 focus:border-yoga-400',
            error
              ? 'border-red-400 focus:ring-red-300'
              : 'border-sacred-200 hover:border-sacred-300',
            fullWidth && 'w-full',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-sacred-500">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, fullWidth, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={clsx('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-sacred-700">{label}</label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(
            'rounded-xl border bg-white px-4 py-2.5 text-sm text-sacred-900 transition-colors resize-y min-h-[120px]',
            'placeholder:text-sacred-400',
            'focus:outline-none focus:ring-2 focus:ring-yoga-400 focus:border-yoga-400',
            error ? 'border-red-400' : 'border-sacred-200 hover:border-sacred-300',
            fullWidth && 'w-full',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-sacred-500">{hint}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
