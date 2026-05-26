import { Link } from 'react-router-dom'
import { Card } from '../../shared/ui/Card'
import { Button } from '../../shared/ui/Button'
import { cn } from '../../lib/utils'

export interface ProductCardItem {
  id: number
  nombre: string
  descripcion?: string | null
  precio: number
  imagen_url?: string | null
  activo: boolean
  stock: number
  tiempo_preparacion_minutos: number
  categorias: { id: number; nombre: string }[]
  ingredientes: { id: number; nombre: string; cantidad: number; alergenos: { id: number; nombre: string }[] }[]
}

interface ProductCardProps {
  product: ProductCardItem
}

export function ProductCard({ product }: ProductCardProps) {
  const outOfStock = product.stock <= 0

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
      {/* Image */}
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {product.imagen_url ? (
          <img
            src={product.imagen_url}
            alt={product.nombre}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = ''
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-background text-foreground font-bold text-sm px-3 py-1 rounded-full">
              Sin stock
            </span>
          </div>
        )}
        {product.tiempo_preparacion_minutos > 0 && !outOfStock && (
          <div className="absolute top-2 right-2 bg-background/90 text-xs font-medium px-2 py-1 rounded-full shadow">
            ≈ {product.tiempo_preparacion_minutos} min
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{product.nombre}</h3>
        {product.descripcion && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.descripcion}</p>
        )}

        {/* Categories */}
        {product.categorias.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {product.categorias.slice(0, 3).map((cat) => (
              <span key={cat.id} className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                {cat.nombre}
              </span>
            ))}
            {product.categorias.length > 3 && (
              <span className="text-xs text-muted-foreground">+{product.categorias.length - 3}</span>
            )}
          </div>
        )}

        {/* Allergens warning */}
        {product.ingredientes.some((i) => i.alergenos.length > 0) && (
          <div className="text-xs text-amber-text mb-2">
            ⚠ Contiene alérgenos
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xl font-bold text-primary">${product.precio.toFixed(2)}</span>
          <Link to={`/productos/${product.id}`}>
            <Button
              size="sm"
              variant={outOfStock ? 'outline' : 'primary'}
              disabled={outOfStock}
              className={cn(
                !outOfStock && 'dark:bg-[#218C44] dark:hover:bg-[#1a7036] dark:text-white'
              )}
            >
              {outOfStock ? 'Sin stock' : 'Ver detalle'}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
