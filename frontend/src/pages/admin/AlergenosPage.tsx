import { useState, useEffect, useCallback, useMemo, useActionState } from 'react'
import { api } from '../../lib/api'
import { Badge, Button, Card, Modal, PageContainer, TableSkeleton, ConfirmDialog } from '../../shared/ui'
import { useFormModal } from '../../shared/hooks/useFormModal'
import { useConfirmDialog } from '../../shared/hooks/useConfirmDialog'
import { useUIStore } from '../../stores/uiStore'
import { handleError } from '../../shared/utils/logger'
import type { FormState } from '../../shared/types/form'

interface Alergeno {
  id: number
  nombre: string
  icono?: string | null
  activo: boolean
  creado_en?: string
  actualizado_en?: string
}

interface AlergenoFormData {
  nombre: string
  icono: string
}

const emptyForm: AlergenoFormData = {
  nombre: '',
  icono: '',
}

export default function AlergenosPage() {
  const [items, setItems] = useState<Alergeno[]>([])
  const [loading, setLoading] = useState(true)
  const addToast = useUIStore((s) => s.addToast)

  const modal = useFormModal<AlergenoFormData, Alergeno>(emptyForm)
  const deleteDialog = useConfirmDialog<Alergeno>()

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/alergenos', { params: { solo_activos: false } })
      setItems(res.data || [])
    } catch {
      addToast('Error al cargar alérgenos', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const submitAction = useCallback(
    async (_prevState: FormState<AlergenoFormData>, formData: FormData): Promise<FormState<AlergenoFormData>> => {
      const data: AlergenoFormData = {
        nombre: formData.get('nombre') as string,
        icono: (formData.get('icono') as string) || '',
      }

      if (!data.nombre.trim()) {
        return { errors: { nombre: 'El nombre es requerido' }, isSuccess: false }
      }

      try {
        const payload: Record<string, unknown> = { ...data }
        if (!payload.icono) delete payload.icono

        if (modal.selectedItem) {
          await api.put(`/alergenos/${modal.selectedItem.id}`, payload)
          addToast('Alérgeno actualizado', 'success')
        } else {
          await api.post('/alergenos', payload)
          addToast('Alérgeno creado', 'success')
        }
        fetchItems()
        return { isSuccess: true, message: 'Guardado correctamente' }
      } catch (error) {
        const message = handleError(error, 'AlergenosPage.submitAction')
        addToast(`Error al guardar: ${message}`, 'error')
        return { isSuccess: false, message: `Error: ${message}` }
      }
    },
    [modal.selectedItem, fetchItems, addToast]
  )

  const [state, formAction, isPending] = useActionState<FormState<AlergenoFormData>, FormData>(submitAction, {
    isSuccess: false,
  })

  if (state.isSuccess && modal.isOpen) {
    modal.close()
  }

  const handleDelete = useCallback(async () => {
    const item = deleteDialog.item
    if (!item) return

    try {
      await api.delete(`/alergenos/${item.id}`)
      addToast('Alérgeno desactivado', 'success')
      fetchItems()
      deleteDialog.close()
    } catch (error) {
      const message = handleError(error, 'AlergenosPage.handleDelete')
      addToast(`Error al desactivar: ${message}`, 'error')
    }
  }, [deleteDialog, fetchItems, addToast])

  const columns = useMemo(
    () => [
      {
        key: 'nombre',
        label: 'Nombre',
        render: (item: Alergeno) => <span className="font-medium">{item.nombre}</span>,
      },
      {
        key: 'activo',
        label: 'Estado',
        width: 'w-24',
        render: (item: Alergeno) =>
          item.activo ? (
            <Badge variant="success">Activo</Badge>
          ) : (
            <Badge variant="danger">Inactivo</Badge>
          ),
      },
      {
        key: 'acciones',
        label: 'Acciones',
        width: 'w-28',
        render: (item: Alergeno) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                modal.openEdit(item)
                modal.setFormData({
                  nombre: item.nombre,
                  icono: item.icono || '',
                })
              }}
              aria-label={`Editar ${item.nombre}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              aria-label={`Desactivar ${item.nombre}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </Button>
          </div>
        ),
      },
    ],
    [deleteDialog, modal]
  )

  if (loading) {
    return (
      <PageContainer title="Alérgenos" description="Gestión de tipos de alérgenos">
        <Card className="p-6">
          <TableSkeleton rows={5} columns={3} />
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Alérgenos"
      description={`Gestión de tipos de alérgenos (${items.length} registros)`}
      actions={
        <Button onClick={() => modal.openCreate()}>+ Nuevo Alérgeno</Button>
      }
    >
      {/* Modal Form */}
      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={modal.selectedItem ? 'Editar Alérgeno' : 'Nuevo Alérgeno'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={modal.close} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" form="alergeno-form" isLoading={isPending}>
              {modal.selectedItem ? 'Actualizar' : 'Crear'}
            </Button>
          </>
        }
      >
        <form id="alergeno-form" action={formAction} className="space-y-4">
          <input type="hidden" name="modal_open" value="true" />

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Nombre <span className="text-destructive">*</span>
            </label>
            <input
              name="nombre"
              defaultValue={modal.selectedItem?.nombre ?? modal.formData.nombre}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-background text-foreground"
              placeholder="Ej: Gluten"
              required
            />
            {state.errors?.nombre && (
              <p className="text-xs text-destructive mt-1">{state.errors.nombre}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Icono (opcional)
            </label>
            <input
              name="icono"
              defaultValue={modal.selectedItem?.icono ?? modal.formData.icono}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-background text-foreground"
              placeholder="Ej: wheat, milk, egg"
            />
            <p className="text-xs text-muted-foreground mt-1">Identificador para icono (uso futuro)</p>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={handleDelete}
        title="Desactivar Alérgeno"
        message={`¿Estás seguro de desactivar "${deleteDialog.item?.nombre}"? Los ingredientes asociados mantendrán sus datos, pero no aparecerá en los filtros del catálogo.`}
        confirmLabel="Desactivar"
      />

      {/* Table */}
      {items.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">No hay alérgenos todavía</p>
            <p className="text-sm">Creá el primer alérgeno para comenzar</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className={`text-left px-4 py-3 font-medium text-muted-foreground ${col.width ?? ''}`}>
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
        </Card>
      )}
    </PageContainer>
  )
}
