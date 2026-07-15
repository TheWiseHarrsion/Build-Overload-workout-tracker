import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  const id = props.id || props.name

  return (
    <div className="w-full">
      {label && (
        <label
          className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
          htmlFor={typeof id === 'string' ? id : undefined}
        >
          {label}
        </label>
      )}
      <input
        id={typeof id === 'string' ? id : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error && typeof id === 'string' ? `${id}-error` : undefined}
        className={`input-field ${className}`}
        {...props}
      />
      {error && (
        <p id={typeof id === 'string' ? `${id}-error` : undefined} className="mt-2 text-sm font-medium text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}
