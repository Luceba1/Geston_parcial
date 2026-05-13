from sqlmodel import Session
from features.repositories.base_repository import BaseRepository
from features.repositories.usuario_repository import UsuarioRepository
from features.repositories.rol_repository import RolRepository
from features.repositories.categoria_repository import CategoriaRepository
from features.repositories.ingrediente_repository import IngredienteRepository
from features.repositories.producto_repository import ProductoRepository
from features.repositories.direccion_repository import DireccionRepository
from features.repositories.pedido_repository import PedidoRepository
from features.repositories.forma_pago_repository import FormaPagoRepository


class UnitOfWork:
    def __init__(self, session: Session):
        self._session = session

    @property
    def usuarios(self) -> UsuarioRepository:
        return UsuarioRepository(self._session)

    @property
    def roles(self) -> RolRepository:
        return RolRepository(self._session)

    @property
    def categorias(self) -> CategoriaRepository:
        return CategoriaRepository(self._session)

    @property
    def ingredientes(self) -> IngredienteRepository:
        return IngredienteRepository(self._session)

    @property
    def productos(self) -> ProductoRepository:
        return ProductoRepository(self._session)

    @property
    def direcciones(self) -> DireccionRepository:
        return DireccionRepository(self._session)

    @property
    def pedidos(self) -> PedidoRepository:
        return PedidoRepository(self._session)

    @property
    def formas_pago(self) -> FormaPagoRepository:
        return FormaPagoRepository(self._session)

    def commit(self) -> None:
        self._session.commit()

    def rollback(self) -> None:
        self._session.rollback()

    def __enter__(self) -> "UnitOfWork":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()