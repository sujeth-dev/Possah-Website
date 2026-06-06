import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { CheckoutFields } from './checkoutTypes'
import { INDIAN_STATES } from './checkoutTypes'
import { Field, inputStyle, inputErrorStyle } from './CheckoutField'

interface Props {
  register: UseFormRegister<CheckoutFields>
  errors: FieldErrors<CheckoutFields>
}

export function CheckoutAddressFields({ register, errors }: Props) {
  return (
    <section aria-labelledby="address-heading">
      <h2
        id="address-heading"
        className="mb-4"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--color-text)',
        }}
      >
        Shipping Address
      </h2>
      <div className="flex flex-col gap-4">
        <Field label="Address Line 1" error={errors.address_line1?.message}>
          <input
            {...register('address_line1')}
            type="text"
            autoComplete="address-line1"
            placeholder="House / Flat no., Street"
            style={errors.address_line1 ? inputErrorStyle : inputStyle}
            aria-invalid={!!errors.address_line1}
          />
        </Field>
        <Field label="Address Line 2 (optional)" error={errors.address_line2?.message}>
          <input
            {...register('address_line2')}
            type="text"
            autoComplete="address-line2"
            placeholder="Landmark, Area"
            style={inputStyle}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="City" error={errors.city?.message}>
            <input
              {...register('city')}
              type="text"
              autoComplete="address-level2"
              style={errors.city ? inputErrorStyle : inputStyle}
              aria-invalid={!!errors.city}
            />
          </Field>
          <Field label="Pincode" error={errors.pincode?.message}>
            <input
              {...register('pincode')}
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="postal-code"
              style={errors.pincode ? inputErrorStyle : inputStyle}
              aria-invalid={!!errors.pincode}
            />
          </Field>
        </div>
        <Field label="State" error={errors.state?.message}>
          <select
            {...register('state')}
            autoComplete="address-level1"
            style={errors.state ? inputErrorStyle : inputStyle}
            aria-invalid={!!errors.state}
          >
            <option value="">Select state / UT</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
    </section>
  )
}
