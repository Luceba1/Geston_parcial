## 1. Backend - Modelo Pago y Dependencias

- [x] 1.1 Agregar `mercadopago` a `backend/requirements.txt`
- [x] 1.2 Crear modelo `Pago` en `backend/features/payments/models.py`: pedido_id, forma_pago_id, monto, estado, mp_preference_id, mp_payment_id, mp_merchant_order_id, mp_status, mp_status_detail, idempotency_key, created_at, updated_at
- [x] 1.3 Agregar `Pago` al `__init__` de payments
- [x] 1.4 Crear migración Alembic manual para `pagos` table (no se pudo autogenerar por conflicto existente en features/__init__.py)
- [x] 1.5 Crear repositorio `PagoRepository` en `backend/features/repositories/pago_repository.py`
- [x] 1.6 Agregar `PagoRepository` al `UnitOfWork`

## 2. Backend - PaymentService

- [x] 2.1 Crear `backend/features/payments/schemas.py`: PagoCreateRequest, PagoResponse, PagoWebhookRequest
- [x] 2.2 Crear `backend/features/payments/service.py` con PaymentService completo
- [x] 2.3 Implementar wrapper seguro del SDK MP con chequeo de MP_ACCESS_TOKEN

## 3. Backend - FSM: Transición automática por pago

- [x] 3.1 Método `_confirmar_pedido()` en PaymentService que transiciona pendiente→confirmado
- [x] 3.2 Validación: solo transiciona si el pedido está en "pendiente"
- [x] 3.3 `auto_return: "approved"` configurado en la preferencia MP

## 4. Backend - PaymentRouter y registro

- [x] 4.1 Crear `backend/features/payments/dependencies.py`
- [x] 4.2 Crear `backend/features/payments/router.py` con 4 endpoints
- [x] 4.3 Registrar router de pagos en `backend/main.py`
- [x] 4.4 Variables MP ya documentadas en `backend/.env.example`

## 5. Frontend - Dependencias y stores

- [x] 5.1 `@mercadopago/sdk-react` NO es necesario — la integración usa redirect a init_point, no el SDK de React
- [x] 5.2 VITE_MP_PUBLIC_KEY ya documentada en `frontend/.env.example`
- [x] 5.3 Actualizar `frontend/src/stores/paymentStore.ts` para flujo completo (loading, error, init_point)

## 6. Frontend - Componente de pago

- [x] 6.1 Crear `frontend/src/shared/ui/PaymentButton.tsx`: botón con redirect a init_point de MP
- [x] 6.2 Mostrar estado "MercadoPago no configurado" si falta VITE_MP_PUBLIC_KEY
- [x] 6.3 Mostrar loading mientras se crea la preferencia
- [x] 6.4 Actualizar barrel export en `frontend/src/shared/ui/index.ts`

## 7. Frontend - Integración en OrderDetailPage

- [x] 7.1 Agregar botón "Pagar con MercadoPago" en OrderDetailPage cuando el pedido está en "pendiente"
- [x] 7.2 Mostrar estado del pago (pendiente/aprobado/rechazado) debajo del total — consulta GET /api/v1/pagos/{pedido_id} en OrderDetailPage
- [x] 7.3 Reintento integrado en el PaymentButton (llama a POST /pagos/{id}/reintentar)

## 8. Frontend - Páginas de retorno

- [x] 8.1 Crear `frontend/src/pages/PagoExitosoPage.tsx`
- [x] 8.2 Crear `frontend/src/pages/PagoFallidoPage.tsx`
- [x] 8.3 Crear `frontend/src/pages/PagoPendientePage.tsx`
- [x] 8.4 Agregar rutas de retorno en `frontend/src/app/routes.tsx`
- [x] 8.5 Verificado: las páginas de retorno son pages sueltas, el barrel export no necesita cambios

## 9. Verificación

- [x] 9.1 Verificar que POST /api/v1/pagos/crear funciona con credenciales MP ✅ (probado con ngrok)
- [ ] 9.2 Verificar que el webhook procesa pagos aprobados y transiciona el pedido ⏳ (requiere IPN de MP)
- [x] 9.3 Verificar que consultar pago retorna estado correcto ✅
- [x] 9.4 Verificar que reintentar pago crea nueva preferencia ✅
- [x] 9.5 Verificar flujo completo: crear pedido → pagar → redirect → confirmado ✅ (probado hoy)
- [ ] 9.6 Verificar que sin credenciales MP los endpoints devuelven 501 ⏳
