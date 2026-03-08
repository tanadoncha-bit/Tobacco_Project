type FormInputProps = {
  name: string
  type: string
  label?: string
  defaultValue?: string
  placeholder?: string
}

const FormInput = ({ name, type, label, defaultValue, placeholder }: FormInputProps) => (
  <div className="space-y-2">
    {label && (
      <label htmlFor={name} className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
    )}
    <input
      id={name}
      name={name}
      type={type}
      placeholder={placeholder}
      defaultValue={defaultValue}
      className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 bg-white transition-all"
    />
  </div>
)

export default FormInput