import { Link } from 'react-router-dom'
import { useCartStore } from '../stores'

export function CartBadge() {
  const totalItems = useCartStore((s) => s.totalItems())

  if (totalItems === 0) return null

  return (
    <Link
      to="/cart"
      className="relative flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
      <span className="bg-green-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 absolute -top-2 -right-2">
        {totalItems > 99 ? '99+' : totalItems}
      </span>
    </Link>
  )
}
