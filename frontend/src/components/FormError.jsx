export default function FormError({ message }) {
  if (!message) return null
  return <p className="text-xs text-rose-600">{message}</p>
}
