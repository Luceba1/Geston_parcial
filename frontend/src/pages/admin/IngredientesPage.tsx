import { useState, useEffect, useCallback, useMemo, useActionState } from 'react'
import { api } from '../../lib/api'
import { Badge, Button, Card, Modal, PageContainer, Pagination, TableSkeleton, ConfirmDialog } from '../../shared/ui'
import { HelpButton } from '../../shared/ui/HelpButton'
import { useFormModal } from '../../shared/hooks/useFormModal'
import { useConfirmDialog } from '../../shared/hooks/useConfirmDialog'
import { useUIStore } from '../../stores/uiStore'
import { handleError } from '../../shared/utils/logger'
import type { FormState } from '../../shared/types/form'
import { helpContent } from './helpContent'

interface AlergenoOption {
  id: number
  nombre: string
  icono?: string | null
}

interface Ingrediente {
  id: number
  nombre: string
  unidad_medida: string
  disponible: boolean
  alergenos?: string | null
  alergenos_list?: AlergenoOption[]
  creado_en?: string
  actualizado_en?: string
}

interface IngredienteFormData {
  nombre: string
  unidad_medida: string
  alergenos: string
  alergeno_ids: string
}

const emptyForm: IngredienteFormData = {
  nombre: '',
  unidad_medida: 'unidad',
  alergenos: '',
  alergeno_ids: '',
}

const UNIDADES = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'gramo', label: 'Gramo (g)' },
  { value: 'kilogramo', label: 'Kilogramo (kg)' },
  { value: 'mililitro', label: 'Mililitro (ml)' },
  { value: 'litro', label: 'Litro (L)' },
  { value: 'cucharada', label: 'Cucharada' },
  { value: 'cucharadita', label: 'Cucharadita' },
  { value: 'taza', label: 'Taza' },
  { value: 'porcion', label: 'Porción' },
]

export default function IngredientesPage() {
  const [items, setItems] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [alergenosDisponibles, setAlergenosDisponibles] = useState<AlergenoOption[]>([])
  const addToast = useUIStore((s) => s.addToast)

  const limit = 10
  const totalPages = Math.ceil(total / limit)

  const modal = useFormModal<IngredienteFormData, Ingrediente>(emptyForm)
  const deleteDialog = useConfirmDialog<Ingrediente>()
  const [alergenoIdsSeleccionados, setAlergenoIdsSeleccionados] = useState<number[]>([])

  // Fetch allergens from API
  const fetchAlergenos = useCallback(async () => {
    try {
      const res = await api.get('/alergenos')
      setAlergenosDisponibles(res.data || [])
    } catch {
      // Non-critical, form will still work
    }
  }, [])

  useEffect(() => {
    fetchAlergenos()
  }, [fetchAlergenos])

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/ingredientes/', { params: { page, limit, solo_disponibles: false } })
      setItems(res.data.items)
      setTotal(res.data.total)
    } catch {
      addToast('Error al cargar ingredientes', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, addToast])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openEditModal = useCallback(
    (item: Ingrediente) => {
      const ids = (item.alergenos_list || []).map((a) => a.id)
      modal.openEdit(item)
      modal.setFormData({
        nombre: item.nombre,
        unidad_medida: item.unidad_medida,
        alergenos: item.alergenos || '',
        alergeno_ids: ids.join(','),
      })
      setAlergenoIdsSeleccionados(ids)
    },
    [modal]
  )

  const submitAction = useCallback(
    async (_prevState: FormState<IngredienteFormData>, formData: FormData): Promise<FormState<IngredienteFormData>> => {
      const alergenoIdsRaw = formData.get('alergeno_ids') as string
      const data: IngredienteFormData = {
        nombre: formData.get('nombre') as string,
        unidad_medida: formData.get('unidad_medida') as string,
        alergenos: (formData.get('alergenos') as string) || '',
        alergeno_ids: alergenoIdsRaw || '',
      }

      if (!data.nombre.trim()) {
        return { errors: { nombre: 'El nombre es requerido' }, isSuccess: false }
      }

      try {
        const payload: Record<string, unknown> = {
          nombre: data.nombre,
          unidad_medida: data.unidad_medida,
        }
        if (data.alergenos) payload.alergenos = data.alergenos
        if (data.alergeno_ids) {
          payload.alergeno_ids = data.alergeno_ids.split(',').map(Number)
        }

        if (modal.selectedItem) {
          await api.put(`/ingredientes/${modal.selectedItem.id}`, payload)
          addToast('Ingrediente actualizado', 'success')
        } else {
          await api.post('/ingredientes/', payload)
          addToast('Ingrediente creado', 'success')
        }
        fetchItems()
        return { isSuccess: true, message: 'Guardado correctamente' }
      } catch (error) {
        const message = handleError(error, 'IngredientesPage.submitAction')
        addToast(`Error al guardar: ${message}`, 'error')
        return { isSuccess: false, message: `Error: ${message}` }
      }
    },
    [modal.selectedItem, fetchItems, addToast]
  )

  const [state, formAction, isPending] = useActionState<FormState<IngredienteFormData>, FormData>(submitAction, {
    isSuccess: false,
  })

  if (state.isSuccess && modal.isOpen) {
    modal.close()
    setAlergenoIdsSeleccionados([])
  }

  const openCreateModal = useCallback(() => {
    setAlergenoIdsSeleccionados([])
    modal.openCreate()
  }, [modal])

  const handleDelete = useCallback(async () => {
    const item = deleteDialog.item
    if (!item) return

    try {
      await api.delete(`/ingredientes/${item.id}`)
      addToast('Ingrediente eliminado', 'success')
      fetchItems()
      deleteDialog.close()
    } catch (error) {
      const message = handleError(error, 'IngredientesPage.handleDelete')
      addToast(`Error al eliminar: ${message}`, 'error')
    }
  }, [deleteDialog, fetchItems, addToast])

  const toggleDisponible = useCallback(
    async (item: Ingrediente) => {
      try {
        await api.put(`/ingredientes/${item.id}`, { disponible: !item.disponible })
        addToast(`Ingrediente ${item.disponible ? 'desactivado' : 'activado'}`, 'success')
        fetchItems()
      } catch (error) {
        const message = handleError(error, 'IngredientesPage.toggleDisponible')
        addToast(`Error: ${message}`, 'error')
      }
    },
    [fetchItems, addToast]
  )

  const columns = useMemo(
    () => [
      {
        key: 'nombre',
        label: 'Nombre',
        render: (item: Ingrediente) => <span className="font-medium">{item.nombre}</span>,
      },
      {
        key: 'unidad_medida',
        label: 'Unidad',
        width: 'w-28',
        render: (item: Ingrediente) => (
          <span className="text-muted-foreground">
            {UNIDADES.find((u) => u.value === item.unidad_medida)?.label ?? item.unidad_medida}
          </span>
        ),
      },
      {
        key: 'alergenos',
        label: 'Alérgenos',
        render: (item: Ingrediente) =>
          item.alergenos_list && item.alergenos_list.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {item.alergenos_list.map((a) => (
                <span key={a.id} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                  {a.nombre}
                </span>
              ))}
            </div>
          ) : item.alergenos ? (
            <div className="flex gap-1 flex-wrap">
              {item.alergenos.split(',').map((a, i) => (
                <span key={i} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                  {a.trim()}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: 'disponible',
        label: 'Disponible',
        width: 'w-28',
        render: (item: Ingrediente) => (
          <button
            onClick={() => toggleDisponible(item)}
            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors"
            aria-label={`${item.nombre}: ${item.disponible ? 'Disponible' : 'No disponible'}. Hacer clic para cambiar.`}
          >
            {item.disponible ? (
              <Badge variant="success">Disponible</Badge>
            ) : (
              <Badge variant="danger">No disponible</Badge>
            )}
          </button>
        ),
      },
      {
        key: 'acciones',
        label: 'Acciones',
        width: 'w-28',
        render: (item: Ingrediente) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                openEditModal(item)
              }}
              aria-label={`Editar ${item.nombre}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                deleteDialog.open(item)
              }}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              aria-label={`Eliminar ${item.nombre}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </Button>
          </div>
        ),
      },
    ],
    [deleteDialog, openEditModal, toggleDisponible]
  )

  if (loading) {
    return (
      <PageContainer title="Ingredientes" description="Gestión de ingredientes y alérgenos" helpContent={helpContent.ingredientes}>
        <Card className="p-6">
          <TableSkeleton rows={5} columns={5} />
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Ingredientes"
      description={`Gestión de ingredientes y alérgenos (${total} registros)`}
      helpContent={helpContent.ingredientes}
      actions={
        <Button onClick={openCreateModal}>+ Nuevo Ingrediente</Button>
      }
    >
      {/* Modal Form */}
      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={modal.selectedItem ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={modal.close} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" form="ingrediente-form" isLoading={isPending}>
              {modal.selectedItem ? 'Actualizar' : 'Crear'}
            </Button>
          </>
        }
      >
        <form id="ingrediente-form" action={formAction} className="space-y-4">
          {/* HelpButton as first element */}
          <div className="flex items-center gap-2 mb-2">
            <HelpButton
              title="Formulario de Ingrediente"
              content={
                <div className="space-y-3">
                  <p>
                    <strong>Completá los campos</strong> para crear o editar un ingrediente:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Nombre:</strong> Nombre del ingrediente (ej: Harina de trigo).
                    </li>
                    <li>
                      <strong>Unidad de medida:</strong> Cómo se mide este ingrediente.
                    </li>
                    <li>
                      <strong>Alérgenos:</strong> Marcá los alérgenos que correspondan al ingrediente.
                    </li>
                  </ul>
                </div>
              }
            />
            <span className="text-sm text-muted-foreground">Ayuda sobre el formulario</span>
          </div>

          {/* Hidden field to track the form is open */}
          <input type="hidden" name="modal_open" value="true" />

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Nombre <span className="text-destructive">*</span>
            </label>
            <input
              name="nombre"
              defaultValue={modal.selectedItem?.nombre ?? modal.formData.nombre}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-background text-foreground"
              placeholder="Nombre del ingrediente"
              required
            />
            {state.errors?.nombre && (
              <p className="text-xs text-destructive mt-1">{state.errors.nombre}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Unidad de medida <span className="text-destructive">*</span>
            </label>
            <select
              name="unidad_medida"
              defaultValue={modal.selectedItem?.unidad_medida ?? modal.formData.unidad_medida}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-background text-foreground"
            >
              {UNIDADES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Alérgenos</label>
            <input
              type="hidden"
              name="alergenos"
              value={alergenoIdsSeleccionados.map((id) => {
                const a = alergenosDisponibles.find((x) => x.id === id)
                return a ? a.nombre : ''
              }).filter(Boolean).join(', ')}
            />
            <input
              type="hidden"
              name="alergeno_ids"
              value={alergenoIdsSeleccionados.join(',')}
            />
            {alergenosDisponibles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Cargando alérgenos...</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {alergenosDisponibles.map((alergeno) => {
                  const checked = alergenoIdsSeleccionados.includes(alergeno.id)
                  return (
                    <label
                      key={alergeno.id}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setAlergenoIdsSeleccionados((prev) =>
                            checked ? prev.filter((id) => id !== alergeno.id) : [...prev, alergeno.id]
                          )
                        }}
                        className="rounded border-border text-yellow-600 focus-visible:ring-ring"
                      />
                      <span className="text-foreground">{alergeno.nombre}</span>
                    </label>
                  )
                })}
              </div>
            )}
            {alergenoIdsSeleccionados.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {alergenoIdsSeleccionados.map((id) => {
                  const a = alergenosDisponibles.find((x) => x.id === id)
                  return a ? (
                    <span key={id} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      {a.nombre}
                    </span>
                  ) : null
                })}
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={handleDelete}
        title="Eliminar Ingrediente"
        message={`¿Estás seguro de eliminar "${deleteDialog.item?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />

      {/* Table */}
      {items.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">No hay ingredientes todavía</p>
            <p className="text-sm">Creá el primer ingrediente para comenzar</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`text-left px-4 py-3 font-medium text-muted-foreground ${col.width ?? ''}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-accent transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3 ${col.width ?? ''}`}>
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={limit}
            onPageChange={setPage}
          />
        </Card>
      )}
    </PageContainer>
  )
}
