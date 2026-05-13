from datetime import datetime, date
from typing import Optional
from sqlmodel import Session, text, select
from sqlalchemy import func

from features.admin.schemas import (
    UserListResponse, UserUpdateRequest, UserEstadoUpdateRequest,
    PaginatedUsersResponse, MetricasResumen, ProductoMasVendido,
    PedidosPorEstado, VentaPeriodo, VentasPorPeriodoResponse,
    TopProductoResponse, PedidosPorEstadoResponse, ConfigItem,
)
from features.auth.models import Usuario, Rol, UsuarioRol
from features.admin.models import Configuracion
from features.repositories.unit_of_work import UnitOfWork
from core.exceptions import BadRequestException, NotFoundException


class AdminService:
    def __init__(self, uow: UnitOfWork, session: Session):
        self._uow = uow
        self._session = session

    # ──────────────────────────────────────────────
    #  USUARIOS
    # ──────────────────────────────────────────────

    def list_users(
        self,
        q: Optional[str] = None,
        rol: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> PaginatedUsersResponse:
        base_query = """
            SELECT u.id, u.email, u.nombre, u.telefono, u.activo, u.creado_en
            FROM usuarios u
            WHERE 1=1
        """
        count_query = """
            SELECT COUNT(DISTINCT u.id)
            FROM usuarios u
            WHERE 1=1
        """
        params: dict = {}

        if q:
            filtro = " AND (u.nombre LIKE :q OR u.email LIKE :q)"
            base_query += filtro
            count_query += filtro
            params["q"] = f"%{q}%"

        if rol:
            filtro_rol = """
                AND u.id IN (
                    SELECT ur.usuario_id FROM usuario_roles ur
                    JOIN roles r ON r.id = ur.rol_id
                    WHERE r.nombre = :rol
                )
            """
            base_query += filtro_rol
            count_query += filtro_rol
            params["rol"] = rol

        # Get total count
        total = self._session.execute(text(count_query), params).scalar() or 0

        # Get paginated results
        base_query += " ORDER BY u.creado_en DESC LIMIT :limit OFFSET :skip"
        params["limit"] = limit
        params["skip"] = skip
        rows = self._session.execute(text(base_query), params).all()

        items = []
        for row in rows:
            # Get roles for each user
            roles_query = text("""
                SELECT r.nombre FROM roles r
                JOIN usuario_roles ur ON r.id = ur.rol_id
                WHERE ur.usuario_id = :uid
            """)
            user_roles = self._session.execute(roles_query, {"uid": row.id}).all()
            items.append(UserListResponse(
                id=row.id,
                email=row.email,
                nombre=row.nombre,
                telefono=row.telefono,
                activo=row.activo,
                roles=[r[0] for r in user_roles],
                creado_en=row.creado_en,
            ))

        return PaginatedUsersResponse(items=items, total=total, skip=skip, limit=limit)

    def update_user(self, user_id: int, data: UserUpdateRequest) -> UserListResponse:
        usuario = self._session.get(Usuario, user_id)
        if not usuario:
            raise NotFoundException(f"Usuario {user_id} no encontrado")

        # Update fields
        if data.nombre is not None:
            usuario.nombre = data.nombre
        if data.telefono is not None:
            usuario.telefono = data.telefono

        # Update roles
        if data.roles is not None:
            # Check: if removing ADMIN from the last admin
            current_roles = self._get_user_role_names(user_id)
            was_admin = "admin" in current_roles
            will_be_admin = "admin" in data.roles

            if was_admin and not will_be_admin:
                # Check if this is the last admin
                admin_count = self._count_admins()
                if admin_count <= 1:
                    raise BadRequestException(
                        "No se puede remover el rol ADMIN al último administrador del sistema"
                    )

            # Rebuild roles
            self._session.execute(
                text("DELETE FROM usuario_roles WHERE usuario_id = :uid"),
                {"uid": user_id},
            )
            for role_name in data.roles:
                rol = self._session.execute(
                    text("SELECT id FROM roles WHERE nombre = :n"), {"n": role_name}
                ).first()
                if rol:
                    self._session.execute(
                        text("INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (:uid, :rid)"),
                        {"uid": user_id, "rid": rol.id},
                    )

            # Revoke all refresh tokens so user gets new roles on next login
            self._session.execute(
                text("UPDATE refresh_tokens SET revoked = 1 WHERE usuario_id = :uid"),
                {"uid": user_id},
            )

        usuario.actualizado_en = datetime.utcnow()
        self._session.flush()

        return self._build_user_response(user_id)

    def toggle_user_status(self, user_id: int, data: UserEstadoUpdateRequest, current_user_id: int) -> UserListResponse:
        if user_id == current_user_id and not data.activo:
            raise BadRequestException("No puedes desactivarte a ti mismo")

        usuario = self._session.get(Usuario, user_id)
        if not usuario:
            raise NotFoundException(f"Usuario {user_id} no encontrado")

        usuario.activo = data.activo
        usuario.actualizado_en = datetime.utcnow()

        if not data.activo:
            # Revoke all tokens
            self._session.execute(
                text("UPDATE refresh_tokens SET revoked = 1 WHERE usuario_id = :uid"),
                {"uid": user_id},
            )

        self._session.flush()
        return self._build_user_response(user_id)

    # ──────────────────────────────────────────────
    #  MÉTRICAS
    # ──────────────────────────────────────────────

    def get_resumen(self, desde: date, hasta: date) -> MetricasResumen:
        # Total ventas (pedidos entregados)
        ventas = self._session.execute(text("""
            SELECT COALESCE(SUM(p.total), 0) as total_ventas,
                   COUNT(*) as cantidad_pedidos
            FROM pedidos p
            JOIN estados_pedido e ON e.id = p.estado_id
            WHERE p.fecha_pedido BETWEEN :desde AND :hasta
              AND e.nombre = 'entregado'
        """), {"desde": desde, "hasta": hasta}).first()

        # Cantidad de usuarios
        total_usuarios = self._session.execute(
            text("SELECT COUNT(*) FROM usuarios WHERE eliminado_en IS NULL")
        ).scalar() or 0

        # Top 5 productos más vendidos
        top_productos = self._session.execute(text("""
            SELECT dp.producto_id,
                   dp.nombre_snapshot,
                   SUM(dp.cantidad) as cantidad_total,
                   SUM(dp.cantidad * dp.precio_snapshot) as ingreso_total
            FROM detalles_pedido dp
            JOIN pedidos p ON p.id = dp.pedido_id
            JOIN estados_pedido e ON e.id = p.estado_id
            WHERE p.fecha_pedido BETWEEN :desde AND :hasta
              AND e.nombre = 'entregado'
            GROUP BY dp.producto_id, dp.nombre_snapshot
            ORDER BY cantidad_total DESC
            LIMIT 5
        """), {"desde": desde, "hasta": hasta}).all()

        # Pedidos por estado
        pedidos_por_estado = self._session.execute(text("""
            SELECT e.id as estado_id,
                   e.nombre as estado_nombre,
                   COUNT(p.id) as cantidad
            FROM estados_pedido e
            LEFT JOIN pedidos p ON p.estado_id = e.id
                AND p.fecha_pedido BETWEEN :desde AND :hasta
            GROUP BY e.id, e.nombre
            ORDER BY e.orden
        """), {"desde": desde, "hasta": hasta}).all()

        return MetricasResumen(
            total_ventas=float(ventas.total_ventas) if ventas else 0,
            cantidad_pedidos=ventas.cantidad_pedidos if ventas else 0,
            cantidad_usuarios=total_usuarios,
            productos_mas_vendidos=[
                ProductoMasVendido(
                    producto_id=p.producto_id,
                    nombre_snapshot=p.nombre_snapshot,
                    cantidad_total_vendida=int(p.cantidad_total),
                    ingreso_total_generado=float(p.ingreso_total),
                ) for p in top_productos
            ],
            pedidos_por_estado=[
                PedidosPorEstado(
                    estado_id=e.estado_id,
                    estado_nombre=e.estado_nombre,
                    cantidad=e.cantidad,
                ) for e in pedidos_por_estado
            ],
        )

    def get_ventas(self, desde: date, hasta: date, granularidad: str = "dia") -> VentasPorPeriodoResponse:
        if granularidad not in ("dia", "semana", "mes"):
            granularidad = "dia"

        if granularidad == "dia":
            date_trunc = "DATE(p.fecha_pedido)"
        elif granularidad == "semana":
            date_trunc = "DATE_FORMAT(p.fecha_pedido, '%x-%v')"
        else:  # mes
            date_trunc = "DATE_FORMAT(p.fecha_pedido, '%Y-%m')"

        query = text(f"""
            SELECT {date_trunc} as fecha,
                   COALESCE(SUM(p.total), 0) as monto_total,
                   COUNT(*) as cantidad_pedidos
            FROM pedidos p
            JOIN estados_pedido e ON e.id = p.estado_id
            WHERE p.fecha_pedido BETWEEN :desde AND :hasta
              AND e.nombre = 'entregado'
            GROUP BY fecha
            ORDER BY fecha ASC
        """)

        rows = self._session.execute(query, {"desde": desde, "hasta": hasta}).all()

        return VentasPorPeriodoResponse(
            items=[
                VentaPeriodo(
                    fecha=str(r.fecha),
                    monto_total=float(r.monto_total),
                    cantidad_pedidos=r.cantidad_pedidos,
                ) for r in rows
            ],
            desde=desde.isoformat(),
            hasta=hasta.isoformat(),
            granularidad=granularidad,
        )

    def get_top_productos(self, top: int = 10, desde: date = None, hasta: date = None) -> TopProductoResponse:
        # Default to current month if no dates provided
        if desde is None:
            desde = date.today().replace(day=1)
        if hasta is None:
            hasta = date.today()

        rows = self._session.execute(text("""
            SELECT dp.producto_id,
                   dp.nombre_snapshot,
                   SUM(dp.cantidad) as cantidad_total,
                   SUM(dp.cantidad * dp.precio_snapshot) as ingreso_total
            FROM detalles_pedido dp
            JOIN pedidos p ON p.id = dp.pedido_id
            JOIN estados_pedido e ON e.id = p.estado_id
            WHERE p.fecha_pedido BETWEEN :desde AND :hasta
              AND e.nombre = 'entregado'
            GROUP BY dp.producto_id, dp.nombre_snapshot
            ORDER BY cantidad_total DESC
            LIMIT :top
        """), {"desde": desde, "hasta": hasta, "top": top}).all()

        return TopProductoResponse(
            items=[
                ProductoMasVendido(
                    producto_id=r.producto_id,
                    nombre_snapshot=r.nombre_snapshot,
                    cantidad_total_vendida=int(r.cantidad_total),
                    ingreso_total_generado=float(r.ingreso_total),
                ) for r in rows
            ],
            top=top,
            desde=desde.isoformat(),
            hasta=hasta.isoformat(),
        )

    def get_pedidos_por_estado(self, desde: date = None, hasta: date = None) -> PedidosPorEstadoResponse:
        if desde is None:
            desde = date.today().replace(day=1)
        if hasta is None:
            hasta = date.today()

        rows = self._session.execute(text("""
            SELECT e.id as estado_id,
                   e.nombre as estado_nombre,
                   COUNT(p.id) as cantidad
            FROM estados_pedido e
            LEFT JOIN pedidos p ON p.estado_id = e.id
                AND p.fecha_pedido BETWEEN :desde AND :hasta
            GROUP BY e.id, e.nombre
            ORDER BY e.orden
        """), {"desde": desde, "hasta": hasta}).all()

        return PedidosPorEstadoResponse(
            items=[
                PedidosPorEstado(
                    estado_id=r.estado_id,
                    estado_nombre=r.estado_nombre,
                    cantidad=r.cantidad,
                ) for r in rows
            ],
            desde=desde.isoformat(),
            hasta=hasta.isoformat(),
        )

    # ──────────────────────────────────────────────
    #  CONFIGURACIÓN
    # ──────────────────────────────────────────────

    def get_config(self) -> list[ConfigItem]:
        configs = self._session.execute(
            text("""
                SELECT c.clave, c.valor, u.nombre as updated_by, c.updated_at
                FROM configuracion c
                LEFT JOIN usuarios u ON u.id = c.updated_by_user_id
                ORDER BY c.clave
            """)
        ).all()

        return [
            ConfigItem(
                clave=r.clave,
                valor=r.valor,
                updated_by=r.updated_by,
                updated_at=r.updated_at,
            ) for r in configs
        ]

    def update_config(self, configs: dict[str, str], user_id: int) -> list[ConfigItem]:
        now = datetime.utcnow()
        for clave, valor in configs.items():
            existing = self._uow.configuracion.get_by_clave(clave)
            if existing:
                existing.valor = valor
                existing.updated_by_user_id = user_id
                existing.updated_at = now
            else:
                new_config = Configuracion(
                    clave=clave,
                    valor=valor,
                    updated_by_user_id=user_id,
                    updated_at=now,
                )
                self._session.add(new_config)

        self._session.flush()
        return self.get_config()

    # ──────────────────────────────────────────────
    #  HELPERS
    # ──────────────────────────────────────────────

    def _get_user_role_names(self, user_id: int) -> list[str]:
        rows = self._session.execute(
            text("""
                SELECT r.nombre FROM roles r
                JOIN usuario_roles ur ON r.id = ur.rol_id
                WHERE ur.usuario_id = :uid
            """),
            {"uid": user_id},
        ).all()
        return [r[0] for r in rows]

    def _count_admins(self) -> int:
        return self._session.execute(
            text("""
                SELECT COUNT(DISTINCT ur.usuario_id)
                FROM usuario_roles ur
                JOIN roles r ON r.id = ur.rol_id
                WHERE r.nombre = 'admin'
            """)
        ).scalar() or 0

    def _build_user_response(self, user_id: int) -> UserListResponse:
        usuario = self._session.get(Usuario, user_id)
        if not usuario:
            raise NotFoundException(f"Usuario {user_id} no encontrado")
        roles = self._get_user_role_names(user_id)
        return UserListResponse(
            id=usuario.id,
            email=usuario.email,
            nombre=usuario.nombre,
            telefono=usuario.telefono,
            activo=usuario.activo,
            roles=roles,
            creado_en=usuario.creado_en,
        )
