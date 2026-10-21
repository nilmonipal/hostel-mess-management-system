function FormInput({ id, label, type = 'text', ...inputProps }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-semibold text-slate-700" htmlFor={id}>
        {label}
      </label>
      <input
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#a20d24] focus:ring-2 focus:ring-[#a20d24]/15"
        id={id}
        name={id}
        type={type}
        {...inputProps}
      />
    </div>
  )
}

export default FormInput
