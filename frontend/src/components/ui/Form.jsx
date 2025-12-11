import React, { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils'

export const Input = React.forwardRef(
  ({ className, type = 'text', error, valid, id, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    return (
      <input
        type={type}
        id={id}
        aria-describedby={ariaDescribedBy}
        className={cn(
          'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          error 
            ? 'border-red-500 focus-visible:ring-red-500' 
            : valid 
            ? 'border-green-500 focus-visible:ring-green-500'
            : 'border-input focus-visible:ring-ring',
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export const Label = React.forwardRef(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  )
)

Label.displayName = 'Label'

export const FormField = ({ label, children, error, required, className, helpText, id: providedId }) => {
  const generatedId = useId()
  const fieldId = providedId || generatedId
  const errorId = `${fieldId}-error`
  const helpTextId = `${fieldId}-help`

  // Clone children to add id and aria-describedby
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        id: fieldId,
        'aria-describedby': error ? errorId : helpText ? helpTextId : undefined,
        'aria-invalid': error ? 'true' : undefined,
        ...child.props
      })
    }
    return child
  })

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </Label>
      )}
      <div className="relative">
        {childrenWithProps}
      </div>
      {error && (
        <motion.p 
          id={errorId}
          className="text-sm text-red-500 flex items-center gap-1 mt-1"
          role="alert"
          aria-live="polite"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </motion.p>
      )}
      {!error && helpText && (
        <div id={helpTextId} className="text-xs text-muted-foreground mt-1">
          {helpText}
        </div>
      )}
    </div>
  )
}

export const Textarea = React.forwardRef(
  ({ className, id, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    return (
      <textarea
        id={id}
        aria-describedby={ariaDescribedBy}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export const Select = React.forwardRef(
  ({ className, children, id, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    return (
      <select
        id={id}
        aria-describedby={ariaDescribedBy}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)

Select.displayName = 'Select'

export const Checkbox = React.forwardRef(
  ({ className, ...props }, ref) => (
    <input
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)

Checkbox.displayName = 'Checkbox'

export const Switch = React.forwardRef(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-input',
          className
        )}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    )
  }
)

Switch.displayName = 'Switch'

export const Radio = React.forwardRef(
  ({ className, id, name, value, checked, onChange, label, ...props }, ref) => {
    const radioId = id || `radio-${name}-${value}`
    
    return (
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          id={radioId}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className={cn(
            'h-4 w-4 border-primary text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2',
            className
          )}
          ref={ref}
          {...props}
        />
        {label && (
          <Label htmlFor={radioId} className="font-normal cursor-pointer">
            {label}
          </Label>
        )}
      </div>
    )
  }
)

Radio.displayName = 'Radio'

export const RadioGroup = ({ name, value, onChange, children, className, ...props }) => {
  return (
    <div className={cn('space-y-2', className)} role="radiogroup" {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === Radio) {
          return React.cloneElement(child, {
            name,
            checked: child.props.value === value,
            onChange: (e) => onChange?.(e.target.value),
          })
        }
        return child
      })}
    </div>
  )
}

RadioGroup.displayName = 'RadioGroup'

export const DatePicker = React.forwardRef(
  ({ className, error, valid, id, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    return (
      <Input
        type="date"
        id={id}
        aria-describedby={ariaDescribedBy}
        error={error}
        valid={valid}
        className={className}
        ref={ref}
        {...props}
      />
    )
  }
)

DatePicker.displayName = 'DatePicker'

export const FileUpload = React.forwardRef(
  ({ 
    className, 
    accept, 
    multiple = false, 
    onChange, 
    error,
    id,
    'aria-describedby': ariaDescribedBy,
    ...props 
  }, ref) => {
    const [dragActive, setDragActive] = React.useState(false)
    const fileInputRef = React.useRef(null)

    React.useImperativeHandle(ref, () => fileInputRef.current)

    const handleDrag = (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true)
      } else if (e.type === 'dragleave') {
        setDragActive(false)
      }
    }

    const handleDrop = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const event = {
          target: {
            files: e.dataTransfer.files,
          },
        }
        onChange?.(event)
      }
    }

    const handleChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        onChange?.(e)
      }
    }

    return (
      <div className="relative">
        <input
          type="file"
          id={id}
          aria-describedby={ariaDescribedBy}
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          ref={fileInputRef}
          className="hidden"
          {...props}
        />
        <motion.label
          htmlFor={id}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : error
              ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
              : 'border-input bg-background hover:bg-accent',
            className
          )}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-10 h-10 mb-3 text-muted-foreground"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              {accept ? `Accepted: ${accept}` : 'Any file type'}
            </p>
          </div>
        </motion.label>
      </div>
    )
  }
)

FileUpload.displayName = 'FileUpload'