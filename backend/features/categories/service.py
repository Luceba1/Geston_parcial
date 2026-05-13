from typing import Optional, List
from sqlmodel import Session

from features.categories.models import Categoria
from features.categories.schemas import CategoriaCreate, CategoriaUpdate, CategoriaTree
from features.repositories.categoria_repository import CategoriaRepository
from core.exceptions import NotFoundException, ConflictException, ValidationException


class CategoryService:
    def __init__(self, session: Session):
        self._session = session
        self.repo = CategoriaRepository(session)

    def create(self, data: CategoriaCreate) -> Categoria:
        # Verificar slug único si se proporciona
        if data.slug:
            existing = self.repo.get_by_slug(data.slug)
            if existing:
                raise ConflictException(f"Ya existe una categoría con el slug '{data.slug}'")
        
        # Generar slug automático si no se proporcionó
        slug = data.slug or data.nombre.lower().replace(" ", "-").replace("ñ", "n")
        
        # Verificar que padre_id existe si se proporcionó
        if data.padre_id is not None:
            padre = self.repo.get_by_id(data.padre_id)
            if not padre:
                raise NotFoundException("Categoria padre", data.padre_id)
        
        categoria = self.repo.create({
            "nombre": data.nombre,
            "descripcion": data.descripcion,
            "slug": slug,
            "imagen_url": data.imagen_url,
            "padre_id": data.padre_id,
        })
        return categoria

    def get_tree(self) -> List[CategoriaTree]:
        """Devuelve todas las categorías activas en estructura de árbol."""
        categorias = self.repo.get_tree_data()
        
        # Construir mapa: id -> nodo
        nodos = {}
        for c in categorias:
            nodos[c.id] = CategoriaTree(
                id=c.id,
                nombre=c.nombre,
                descripcion=c.descripcion,
                slug=c.slug,
                imagen_url=c.imagen_url,
                activo=c.activo,
                padre_id=c.padre_id,
                subcategorias=[],
            )
        
        # Armar árbol
        raices: List[CategoriaTree] = []
        for nodo in nodos.values():
            if nodo.padre_id is None or nodo.padre_id not in nodos:
                raices.append(nodo)
            else:
                padre = nodos[nodo.padre_id]
                padre.subcategorias.append(nodo)
        
        return raices

    def get_by_id(self, categoria_id: int) -> Categoria:
        categoria = self.repo.get_by_id(categoria_id)
        if not categoria:
            raise NotFoundException("Categoria", categoria_id)
        return categoria

    def update(self, categoria_id: int, data: CategoriaUpdate) -> Categoria:
        categoria = self.repo.get_by_id(categoria_id)
        if not categoria:
            raise NotFoundException("Categoria", categoria_id)
        
        update_data = data.model_dump(exclude_unset=True)
        
        # Si cambia slug, verificar unicidad
        if "slug" in update_data and update_data["slug"]:
            existing = self.repo.get_by_slug(update_data["slug"])
            if existing and existing.id != categoria_id:
                raise ConflictException(f"El slug '{update_data['slug']}' ya está en uso")
        
        # Si cambia padre_id, validar que no haya ciclo
        if "padre_id" in update_data and update_data["padre_id"] is not None:
            if update_data["padre_id"] == categoria_id:
                raise ValidationException("Una categoría no puede ser padre de sí misma")
            
            padre = self.repo.get_by_id(update_data["padre_id"])
            if not padre:
                raise NotFoundException("Categoria padre", update_data["padre_id"])
            
            # Verificar ciclo: el nuevo padre no puede ser descendiente de esta categoría
            if self._crearia_ciclo(categoria_id, update_data["padre_id"]):
                raise ValidationException("Esta asignación crearía un ciclo en la jerarquía")
        
        updated = self.repo.update(categoria_id, update_data)
        return updated  # type: ignore

    def soft_delete(self, categoria_id: int) -> None:
        categoria = self.repo.get_by_id(categoria_id)
        if not categoria:
            raise NotFoundException("Categoria", categoria_id)
        
        # Verificar que no tenga productos activos
        products_count = self.repo.get_products_count(categoria_id)
        if products_count > 0:
            raise ConflictException(
                f"No se puede eliminar: la categoría tiene {products_count} producto(s) activo(s) asociado(s)"
            )
        
        # Verificar que no tenga subcategorías activas
        subcats = self.repo.get_active_subcategories(categoria_id)
        if subcats:
            raise ConflictException(
                "No se puede eliminar: la categoría tiene subcategorías activas. Reasignelas o elimínelas primero."
            )
        
        self.repo.soft_delete(categoria_id)

    def _crearia_ciclo(self, categoria_id: int, posible_padre_id: int) -> bool:
        """Verifica si asignar posible_padre_id como padre de categoria_id crearía un ciclo."""
        visitados = set()
        actual = posible_padre_id
        while actual is not None:
            if actual == categoria_id:
                return True
            if actual in visitados:
                return False
            visitados.add(actual)
            cat = self.repo.get_by_id(actual)
            actual = cat.padre_id if cat else None
        return False
