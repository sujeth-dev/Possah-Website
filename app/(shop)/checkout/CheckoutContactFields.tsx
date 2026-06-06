import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { CheckoutFields } from './checkoutTypes'
import { Field, inputStyle, inputErrorStyle } from './CheckoutField'

interface Props {
  register: UseFormRegister<CheckoutFields>
  errors: FieldErrors<CheckoutFields>
}

export function CheckoutContactFields({ register, errors }: Props) {
  return (
    <section aria-labelledby="contact-heading">
      <h2
        id="contact-heading"
        className="mb-4"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--color-text)',
        }}
      >
        Contact
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" error={errors.first_name?.message}>
          <input
            {...register('first_name')}
            type="text"
            autoComplete="given-name"
            style={errors.first_name ? inputErrorStyle : inputStyle}
            aria-invalid={!!errors.first_name}
          />
        </Field>
        <Field label="Last Name" error={errors.last_name?.message}>
          <input
            {...register('last_name')}
            type="text"
            autoComplete="family-name"
            style={errors.last_name ? inputErrorStyle : inputStyle}
            aria-invalid={!!errors.last_name}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Field label="Email" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            style={errors.email ? inputErrorStyle : inputStyle}
            aria-invalid={!!errors.email}
          />
        </Field>
        <Field label="Mobile Number" error={errors.phone?.message}>
          <input
            {...register('phone')}
            type="tel"
            autoComplete="tel"
            maxLength={10}
            style={errors.phone ? inputErrorStyle : inputStyle}
            aria-invalid={!!errors.phone}
          />
        </Field>
      </div>
    </section>
  )
}
