import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  interactive?: boolean
}

export function Card({ children, className = '', interactive = true, ...props }: CardProps) {
  return (
    <div className={`card ${interactive ? 'quiet-glow' : ''} ${className}`} {...props}>
      {children}
    </div>
  )
}
