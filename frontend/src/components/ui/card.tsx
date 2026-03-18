import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
  as?: 'div' | 'article' | 'section'
}

export default function Card({ children, className, hover, padding = 'md', as: Tag = 'div' }: CardProps) {
  const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }
  return (
    <Tag
      className={clsx(
        'bg-white rounded-2xl border border-sacred-100 shadow-soft',
        hover && 'transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 cursor-pointer',
        paddings[padding],
        className
      )}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('mb-4', className)}>{children}</div>
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('', className)}>{children}</div>
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('mt-4 pt-4 border-t border-sacred-100', className)}>{children}</div>
}
