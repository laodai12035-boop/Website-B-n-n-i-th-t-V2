/**
 * Button — Nút bấm đa mục đích với loading state.
 *
 * Props:
 *  - variant: 'primary' | 'outline' | 'ghost'
 *  - size: 'sm' | 'md' | 'lg'
 *  - loading (boolean): Hiển thị spinner
 *  - disabled (boolean)
 *  - fullWidth (boolean): w-full
 *  - type: 'button' | 'submit' | 'reset'
 *  - onClick (function)
 *  - children (ReactNode)
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  children,
  ...rest
}) => {
  const variantClasses = {
    primary: 'btn-primary',
    outline: 'btn-outline',
    ghost:
      'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-100 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  }

  const sizeClasses = {
    sm: 'text-xs px-4 py-2',
    md: '',   // Defined in variant class
    lg: 'text-base px-8 py-4',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variantClasses[variant]}
        ${size !== 'md' ? sizeClasses[size] : ''}
        ${fullWidth ? 'w-full' : ''}
      `}
      {...rest}
    >
      {/* Loading spinner */}
      {loading && (
        <svg
          className="animate-spin -ml-1 w-4 h-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

export default Button
