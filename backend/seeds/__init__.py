"""Seed scripts for FoodStore database"""
from database import get_session
from features.auth.models import Rol, Usuario, UsuarioRol
from features.orders.models import EstadoPedido
from features.payments.models import FormaPago
from features.categories.models import Categoria
from features.ingredients.models import Ingrediente, IngredienteAlergeno
from features.allergens.models import Alergeno
from features.products.models import Producto, ProductoCategoria, ProductoIngrediente
from core.security import get_password_hash


def seed_roles():
    """Create default roles"""
    roles = [
        {"nombre": "admin", "descripcion": "Administrador del sistema"},
        {"nombre": "cliente", "descripcion": "Cliente regular"},
        {"nombre": "repartidor", "descripcion": "Repartidor de pedidos"},
        {"nombre": "cocinero", "descripcion": "Personal de cocina"},
    ]
    
    with get_session() as session:
        for rol_data in roles:
            existing = session.query(Rol).filter_by(nombre=rol_data["nombre"]).first()
            if not existing:
                rol = Rol(**rol_data)
                session.add(rol)
                print(f"  -> Created role: {rol_data['nombre']}")
            else:
                print(f"  -> Role already exists: {rol_data['nombre']}")
        session.commit()
    print("[OK] Roles seeded successfully!")


def seed_estados_pedido():
    """Create default order states"""
    estados = [
        {"nombre": "pendiente", "descripcion": "Pedido recibido, esperando confirmacion", "orden": 1},
        {"nombre": "confirmado", "descripcion": "Pedido confirmado por el restaurante", "orden": 2},
        {"nombre": "en_preparacion", "descripcion": "Pedido en cocina", "orden": 3},
        {"nombre": "en_camino", "descripcion": "Pedido en camino (repartidor)", "orden": 4},
        {"nombre": "entregado", "descripcion": "Pedido entregado al cliente", "orden": 5},
        {"nombre": "cancelado", "descripcion": "Pedido cancelado", "orden": 6},
    ]
    
    with get_session() as session:
        for estado_data in estados:
            existing = session.query(EstadoPedido).filter_by(nombre=estado_data["nombre"]).first()
            if not existing:
                estado = EstadoPedido(**estado_data)
                session.add(estado)
                print(f"  -> Created estado: {estado_data['nombre']}")
            else:
                print(f"  -> Estado already exists: {estado_data['nombre']}")
        session.commit()
    print("[OK] Estados de pedido seeded successfully!")


def seed_formas_pago():
    """Create default payment methods"""
    formas = [
        {"nombre": "efectivo", "descripcion": "Pago en efectivo al recibir", "icono": "cash", "activo": True},
        {"nombre": "tarjeta", "descripcion": "Pago con tarjeta de credito/debito", "icono": "card", "activo": True},
        {"nombre": "transferencia", "descripcion": "Transferencia bancaria", "icono": "bank", "activo": True},
        {"nombre": "mercado_pago", "descripcion": "Pago via Mercado Pago", "icono": "mercado-pago", "activo": True},
    ]
    
    with get_session() as session:
        for forma_data in formas:
            existing = session.query(FormaPago).filter_by(nombre=forma_data["nombre"]).first()
            if not existing:
                forma = FormaPago(**forma_data)
                session.add(forma)
                print(f"  -> Created forma de pago: {forma_data['nombre']}")
            else:
                print(f"  -> Forma de pago already exists: {forma_data['nombre']}")
        session.commit()
    print("[OK] Formas de pago seeded successfully!")


def seed_categorias():
    """Create example categories hierarchy"""
    categorias_planas = [
        {"nombre": "Bebidas", "slug": "bebidas"},
        {"nombre": "Bebidas Calientes", "slug": "bebidas-calientes", "padre": "bebidas"},
        {"nombre": "Bebidas Frias", "slug": "bebidas-frias", "padre": "bebidas"},
        {"nombre": "Comidas", "slug": "comidas"},
        {"nombre": "Hamburguesas", "slug": "hamburguesas", "padre": "comidas"},
        {"nombre": "Pizzas", "slug": "pizzas", "padre": "comidas"},
        {"nombre": "Ensaladas", "slug": "ensaladas", "padre": "comidas"},
        {"nombre": "Postres", "slug": "postres"},
        {"nombre": "Snacks", "slug": "snacks"},
    ]

    with get_session() as session:
        slug_to_id = {}
        for cat_data in categorias_planas:
            existing = session.query(Categoria).filter_by(slug=cat_data["slug"]).first()
            if existing:
                slug_to_id[cat_data["slug"]] = existing.id
                print(f"  -> Category already exists: {cat_data['nombre']}")
                continue
            padre_slug = cat_data.pop("padre", None)
            categoria = Categoria(**cat_data)
            session.add(categoria)
            session.flush()
            slug_to_id[categoria.slug] = categoria.id
            if padre_slug:
                categoria.padre_id = slug_to_id.get(padre_slug)
            print(f"  -> Created category: {cat_data['nombre']}")
        session.commit()
    print("[OK] Categorias seeded successfully!")


def seed_alergenos():
    """Create default allergens and link to ingredients."""
    ALERGENOS_POR_DEFECTO = [
        "Lácteos", "Huevo", "Gluten", "Maní", "Frutos secos",
        "Soja", "Pescado", "Sésamo", "Mostaza", "Sulfitos",
    ]

    ALERGENO_MAP = {
        "gluten": "Gluten",
        "lacteos": "Lácteos",
        "huevo": "Huevo",
    }

    with get_session() as session:
        # Create allergens
        alergeno_map = {}
        for nombre in ALERGENOS_POR_DEFECTO:
            existing = session.query(Alergeno).filter_by(nombre=nombre).first()
            if not existing:
                alergeno = Alergeno(nombre=nombre, activo=True)
                session.add(alergeno)
                session.flush()
                alergeno_map[nombre] = alergeno.id
                print(f"  -> Created allergen: {nombre}")
            else:
                alergeno_map[nombre] = existing.id
                print(f"  -> Allergen already exists: {nombre}")

        # Link existing ingredients to allergens based on their alergenos VARCHAR
        map_name_to_id = {k.lower(): v for k, v in alergeno_map.items()}
        for seed_name, alergeno_name in ALERGENO_MAP.items():
            alergeno_id = map_name_to_id.get(alergeno_name.lower())
            if not alergeno_id:
                continue
            for ing_data in INGREDIENTES_SEED:
                if ing_data.get("alergenos", "").lower() == seed_name:
                    ingrediente = session.query(Ingrediente).filter_by(nombre=ing_data["nombre"]).first()
                    if ingrediente:
                        existing_rel = session.query(IngredienteAlergeno).filter_by(
                            ingrediente_id=ingrediente.id,
                            alergeno_id=alergeno_id,
                        ).first()
                        if not existing_rel:
                            session.add(IngredienteAlergeno(
                                ingrediente_id=ingrediente.id,
                                alergeno_id=alergeno_id,
                            ))
        session.commit()
    print("[OK] Alergenos seeded and linked successfully!")


INGREDIENTES_SEED = [
    {"nombre": "Harina", "unidad_medida": "gr", "alergenos": "gluten"},
    {"nombre": "Leche", "unidad_medida": "ml", "alergenos": "lacteos"},
    {"nombre": "Huevo", "unidad_medida": "ud", "alergenos": "huevo"},
    {"nombre": "Queso", "unidad_medida": "gr", "alergenos": "lacteos"},
    {"nombre": "Carne", "unidad_medida": "gr"},
    {"nombre": "Pollo", "unidad_medida": "gr"},
    {"nombre": "Lechuga", "unidad_medida": "gr"},
    {"nombre": "Tomate", "unidad_medida": "ud"},
    {"nombre": "Pan", "unidad_medida": "ud", "alergenos": "gluten"},
    {"nombre": "Chocolate", "unidad_medida": "gr", "alergenos": "lacteos"},
]


def seed_ingredientes():
    """Create example ingredients with allergens"""
    with get_session() as session:
        for ing_data in INGREDIENTES_SEED:
            existing = session.query(Ingrediente).filter_by(nombre=ing_data["nombre"]).first()
            if not existing:
                ingrediente = Ingrediente(**ing_data)
                session.add(ingrediente)
                print(f"  -> Created ingredient: {ing_data['nombre']}")
            else:
                print(f"  -> Ingredient already exists: {ing_data['nombre']}")
        session.commit()
    print("[OK] Ingredientes seeded successfully!")


def seed_productos():
    """Create example products with category and ingredient links"""
    productos_data = [
        {
            "nombre": "Cafe Latte",
            "precio": 350,
            "slug_categoria": "bebidas-calientes",
        },
        {
            "nombre": "Coca-Cola",
            "precio": 250,
            "slug_categoria": "bebidas-frias",
        },
        {
            "nombre": "Hamburguesa Clasica",
            "precio": 850,
            "slug_categoria": "hamburguesas",
            "ingredientes": {"Pan": 2, "Carne": 200, "Lechuga": 50, "Tomate": 2, "Queso": 30},
        },
        {
            "nombre": "Pizza Margherita",
            "precio": 1200,
            "slug_categoria": "pizzas",
            "ingredientes": {"Harina": 300, "Queso": 150, "Tomate": 3},
        },
        {
            "nombre": "Ensalada Caesar",
            "precio": 750,
            "slug_categoria": "ensaladas",
            "ingredientes": {"Lechuga": 200, "Pollo": 150, "Queso": 50},
        },
        {
            "nombre": "Torta de Chocolate",
            "precio": 500,
            "slug_categoria": "postres",
            "ingredientes": {"Harina": 200, "Chocolate": 100, "Huevo": 3, "Leche": 100},
        },
        {
            "nombre": "Papas Fritas",
            "precio": 400,
            "slug_categoria": "snacks",
        },
        {
            "nombre": "Milkshake",
            "precio": 450,
            "slug_categoria": "bebidas-frias",
            "ingredientes": {"Leche": 300, "Chocolate": 50},
        },
    ]

    with get_session() as session:
        for prod_data in productos_data:
            existing = session.query(Producto).filter_by(nombre=prod_data["nombre"]).first()
            if existing:
                print(f"  -> Product already exists: {prod_data['nombre']}")
                continue

            ingredientes_map = prod_data.pop("ingredientes", {})
            slug_categoria = prod_data.pop("slug_categoria")

            producto = Producto(**prod_data)
            session.add(producto)
            session.flush()

            categoria = session.query(Categoria).filter_by(slug=slug_categoria).first()
            if categoria:
                prod_cat = ProductoCategoria(producto_id=producto.id, categoria_id=categoria.id)
                session.add(prod_cat)

            for ing_nombre, cantidad in ingredientes_map.items():
                ingrediente = session.query(Ingrediente).filter_by(nombre=ing_nombre).first()
                if ingrediente:
                    prod_ing = ProductoIngrediente(
                        producto_id=producto.id,
                        ingrediente_id=ingrediente.id,
                        cantidad=cantidad,
                    )
                    session.add(prod_ing)

            print(f"  -> Created product: {prod_data['nombre']}")
        session.commit()
    print("[OK] Productos seeded successfully!")


def seed_usuario_admin():
    """Create default admin user"""
    admin_data = {
        "nombre": "Admin",
        "email": "admin@foodstore.com",
        "password": "admin123",
    }

    with get_session() as session:
        existing = session.query(Usuario).filter_by(email=admin_data["email"]).first()
        if existing:
            print(f"  -> Admin user already exists: {admin_data['email']}")
        else:
            admin_role = session.query(Rol).filter_by(nombre="admin").first()
            if not admin_role:
                print("  -> [ERROR] Admin role not found. Run seed_roles first.")
                return

            hashed_password = get_password_hash(admin_data["password"])
            usuario = Usuario(
                nombre=admin_data["nombre"],
                email=admin_data["email"],
                hashed_password=hashed_password,
            )
            session.add(usuario)
            session.flush()

            usuario_rol = UsuarioRol(usuario_id=usuario.id, rol_id=admin_role.id)
            session.add(usuario_rol)
            print(f"  -> Created admin user: {admin_data['email']}")
        session.commit()
    print("[OK] Admin user seeded successfully!")


def seed_usuario_cocina():
    """Create default cocinero user"""
    cocina_data = {
        "nombre": "Cocinero",
        "email": "cocina@foodstore.com",
        "password": "cocina123",
    }

    with get_session() as session:
        existing = session.query(Usuario).filter_by(email=cocina_data["email"]).first()
        if existing:
            print(f"  -> Cocinero user already exists: {cocina_data['email']}")
        else:
            cocinero_role = session.query(Rol).filter_by(nombre="cocinero").first()
            if not cocinero_role:
                print("  -> [ERROR] Cocinero role not found. Run seed_roles first.")
                return

            hashed_password = get_password_hash(cocina_data["password"])
            usuario = Usuario(
                nombre=cocina_data["nombre"],
                email=cocina_data["email"],
                hashed_password=hashed_password,
            )
            session.add(usuario)
            session.flush()

            usuario_rol = UsuarioRol(usuario_id=usuario.id, rol_id=cocinero_role.id)
            session.add(usuario_rol)
            print(f"  -> Created cocinero user: {cocina_data['email']}")
        session.commit()
    print("[OK] Cocinero user seeded successfully!")


def run_all_seeds():
    """Run all seed functions"""
    print("Starting database seeding...")
    print("\n1. Seeding roles...")
    seed_roles()

    print("\n2. Seeding estados de pedido...")
    seed_estados_pedido()

    print("\n3. Seeding formas de pago...")
    seed_formas_pago()

    print("\n4. Seeding categorias...")
    seed_categorias()

    print("\n5. Seeding alérgenos...")
    seed_alergenos()

    print("\n6. Seeding ingredientes...")
    seed_ingredientes()

    print("\n7. Seeding productos...")
    seed_productos()

    print("\n8. Seeding admin user...")
    seed_usuario_admin()

    print("\n9. Seeding cocinero user...")
    seed_usuario_cocina()

    print("\n[OK] All seeds completed!")


if __name__ == "__main__":
    run_all_seeds()
