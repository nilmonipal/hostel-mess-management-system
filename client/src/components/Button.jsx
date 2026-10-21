function Button({ children, disabled = false, type = 'button' }) {
  return (
    <button
      className="w-full rounded-md bg-[#a20d24] px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-[#85091c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a20d24] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  )
}

export default Button
