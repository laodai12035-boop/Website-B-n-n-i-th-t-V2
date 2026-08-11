/**
 * InputField — Input có label, error message và icon hỗ trợ.
 *
 * Props:
 *  - id (string, bắt buộc): ID duy nhất cho input + label
 *  - label (string): Nhãn hiển thị
 *  - type (string): 'text' | 'email' | 'password' | 'tel'
 *  - value (string): Giá trị hiện tại
 *  - onChange (function): Handler khi giá trị thay đổi
 *  - error (string): Thông báo lỗi (undefined = không hiển thị)
 *  - placeholder (string)
 *  - disabled (boolean)
 *  - required (boolean)
 *  - rightIcon (ReactNode): Icon hiển thị bên phải (vd: toggle password)
 */
const InputField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  required = false,
  rightIcon,
  ...rest
}) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`input-field ${error ? 'error' : ''} ${rightIcon ? 'pr-11' : ''}`}
          {...rest}
        />

        {/* Icon bên phải (toggle password, v.v.) */}
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p id={`${id}-error`} className="form-error" role="alert">
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

export default InputField
