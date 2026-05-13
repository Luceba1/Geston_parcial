"""Seed script to be run from project root (RepositorioBaseFoodStore-SDD)"""
import sys
from pathlib import Path

# Add project root to path so "from backend.xxx" works
project_root = Path(__file__).parent
backend_path = project_root / "backend"
sys.path.insert(0, str(project_root))

# Now we can import from backend
from backend.config import get_settings
from sqlalchemy import create_engine, text

def run_seed_sql():
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("Starting database seeding...")
        
        # Seed roles
        print("\n1. Seeding roles...")
        roles = [
            ("admin", "Administrador del sistema"),
            ("cliente", "Cliente regular"),
            ("repartidor", "Repartidor de pedidos"),
            ("cocinero", "Personal de cocina"),
        ]
        for nombre, descripcion in roles:
            result = conn.execute(text("SELECT id FROM roles WHERE nombre = :nombre"), {"nombre": nombre})
            if not result.first():
                conn.execute(
                    text("INSERT INTO roles (nombre, descripcion) VALUES (:nombre, :descripcion)"),
                    {"nombre": nombre, "descripcion": descripcion}
                )
                print(f"  -> Created role: {nombre}")
            else:
                print(f"  -> Role already exists: {nombre}")
        
        # Seed estados_pedido
        print("\n2. Seeding estados de pedido...")
        estados = [
            ("pendiente", "Pedido recibido, esperando confirmacion", 1),
            ("confirmado", "Pedido confirmado por el restaurante", 2),
            ("en_preparacion", "Pedido en cocina", 3),
            ("listo_para_entrega", "Pedido listo para ser recogido/entregado", 4),
            ("en_camino", "Pedido en camino (repartidor)", 5),
            ("entregado", "Pedido entregado al cliente", 6),
            ("cancelado", "Pedido cancelado", 7),
        ]
        for nombre, descripcion, orden in estados:
            result = conn.execute(text("SELECT id FROM estados_pedido WHERE nombre = :nombre"), {"nombre": nombre})
            if not result.first():
                conn.execute(
                    text("INSERT INTO estados_pedido (nombre, descripcion, orden) VALUES (:nombre, :descripcion, :orden)"),
                    {"nombre": nombre, "descripcion": descripcion, "orden": orden}
                )
                print(f"  -> Created estado: {nombre}")
            else:
                print(f"  -> Estado already exists: {nombre}")
        
        # Seed formas_pago
        print("\n3. Seeding formas de pago...")
        formas = [
            ("efectivo", "Pago en efectivo al recibir", "cash", True),
            ("tarjeta", "Pago con tarjeta de credito/debito", "card", True),
            ("transferencia", "Transferencia bancaria", "bank", True),
            ("mercado_pago", "Pago via Mercado Pago", "mercado-pago", True),
        ]
        for nombre, descripcion, icono, activo in formas:
            result = conn.execute(text("SELECT id FROM formas_pago WHERE nombre = :nombre"), {"nombre": nombre})
            if not result.first():
                conn.execute(
                    text("INSERT INTO formas_pago (nombre, descripcion, icono, activo) VALUES (:nombre, :descripcion, :icono, :activo)"),
                    {"nombre": nombre, "descripcion": descripcion, "icono": icono, "activo": activo}
                )
                print(f"  -> Created forma de pago: {nombre}")
            else:
                print(f"  -> Forma de pago already exists: {nombre}")
        
        # Seed categorías (jerarquía de ejemplo)
        print("\n4. Seeding categorías...")
        categorias_data = [
            ("bebidas", "Bebidas", "Bebidas frías y calientes", None),
            ("bebidas-calientes", "Bebidas Calientes", "Café, té, chocolate", "bebidas"),
            ("bebidas-frias", "Bebidas Frías", "Jugos, refrescos, aguas", "bebidas"),
            ("comidas", "Comidas", "Platos preparados", None),
            ("hamburguesas", "Hamburguesas", "Hamburguesas artesanales", "comidas"),
            ("pizzas", "Pizzas", "Pizzas al horno de barro", "comidas"),
            ("ensaladas", "Ensaladas", "Ensaladas frescas", "comidas"),
            ("postres", "Postres", "Postres caseros", None),
            ("helados", "Helados", "Helados artesanales", "postres"),
            ("tortas", "Tortas", "Tortas y pasteles", "postres"),
        ]
        cat_slug_map = {}
        for slug, nombre, descripcion, padre_slug in categorias_data:
            result = conn.execute(text("SELECT id FROM categorias WHERE slug = :slug"), {"slug": slug})
            existing = result.first()
            if existing:
                cat_slug_map[slug] = existing[0]
                print(f"  -> Category already exists: {nombre}")
                continue
            padre_id = cat_slug_map.get(padre_slug) if padre_slug else None
            conn.execute(
                text("INSERT INTO categorias (nombre, slug, descripcion, activo, padre_id) VALUES (:nombre, :slug, :descripcion, TRUE, :padre_id)"),
                {"nombre": nombre, "slug": slug, "descripcion": descripcion, "padre_id": padre_id}
            )
            result = conn.execute(text("SELECT LAST_INSERT_ID()"))
            cat_slug_map[slug] = result.scalar()
            print(f"  -> Created category: {nombre}")

        # Seed ingredientes (con alérgenos)
        print("\n5. Seeding ingredientes...")
        ingredientes_data = [
            ("harina_trigo", "Harina de trigo", "gramo", "gluten"),
            ("harina_maiz", "Harina de maíz", "gramo", None),
            ("leche", "Leche", "mililitro", "lactosa"),
            ("crema_leche", "Crema de leche", "mililitro", "lactosa"),
            ("queso_mozzarella", "Queso mozzarella", "gramo", "lactosa"),
            ("queso_parmesano", "Queso parmesano", "gramo", "lactosa"),
            ("huevo", "Huevo", "unidad", "huevo"),
            ("manteca", "Manteca", "gramo", "lactosa"),
            ("carne_vacuna", "Carne vacuna", "gramo", None),
            ("pollo", "Pollo", "gramo", None),
            ("tomate", "Tomate", "unidad", None),
            ("lechuga", "Lechuga", "gramo", None),
            ("cebolla", "Cebolla", "unidad", None),
            ("ajo", "Ajo", "diente", None),
            ("aceite_oliva", "Aceite de oliva", "mililitro", None),
            ("sal", "Sal", "gramo", None),
            ("pimienta", "Pimienta", "gramo", None),
            ("oregano", "Orégano", "gramo", None),
            ("chocolate", "Chocolate", "gramo", "leche, soja"),
            ("vainilla", "Esencia de vainilla", "mililitro", None),
            ("azucar", "Azúcar", "gramo", None),
            ("pan_hamburguesa", "Pan de hamburguesa", "unidad", "gluten"),
            ("papas_fritas", "Papas fritas", "gramo", None),
        ]
        ing_id_map = {}
        for codigo, nombre, unidad, alergenos in ingredientes_data:
            result = conn.execute(text("SELECT id FROM ingredientes WHERE nombre = :nombre"), {"nombre": nombre})
            existing = result.first()
            if existing:
                ing_id_map[codigo] = existing[0]
                print(f"  -> Ingredient already exists: {nombre}")
                continue
            conn.execute(
                text("INSERT INTO ingredientes (nombre, unidad_medida, disponible, alergenos) VALUES (:nombre, :unidad, TRUE, :alergenos)"),
                {"nombre": nombre, "unidad": unidad, "alergenos": alergenos}
            )
            result = conn.execute(text("SELECT LAST_INSERT_ID()"))
            ing_id_map[codigo] = result.scalar()
            print(f"  -> Created ingredient: {nombre}")

        # Seed productos de ejemplo (con categorías e ingredientes)
        print("\n6. Seeding productos de ejemplo...")
        productos_data = [
            {
                "nombre": "Hamburguesa Clásica",
                "descripcion": "Hamburguesa de carne vacuna con lechuga, tomate y cebolla",
                "precio": 8500.00,
                "stock": 50,
                "tiempo_prep": 15,
                "slug_categorias": ["hamburguesas"],
                "codigo_ingredientes": {"carne_vacuna": 1, "pan_hamburguesa": 1, "lechuga": 0.2, "tomate": 1, "cebolla": 0.5},
            },
            {
                "nombre": "Hamburguesa con Queso",
                "descripcion": "Hamburguesa de carne con queso mozzarella derretido",
                "precio": 9500.00,
                "stock": 40,
                "tiempo_prep": 15,
                "slug_categorias": ["hamburguesas"],
                "codigo_ingredientes": {"carne_vacuna": 1, "pan_hamburguesa": 1, "queso_mozzarella": 0.5, "lechuga": 0.2, "tomate": 1},
            },
            {
                "nombre": "Pizza Margherita",
                "descripcion": "Pizza clásica con salsa de tomate, mozzarella y albahaca",
                "precio": 12000.00,
                "stock": 30,
                "tiempo_prep": 25,
                "slug_categorias": ["pizzas"],
                "codigo_ingredientes": {"harina_trigo": 0.3, "tomate": 3, "queso_mozzarella": 0.2, "aceite_oliva": 0.05, "sal": 0.01, "oregano": 0.01},
            },
            {
                "nombre": "Ensalada Caesar",
                "descripcion": "Ensalada fresca con pollo, crutones, queso parmesano y aderezo Caesar",
                "precio": 9800.00,
                "stock": 25,
                "tiempo_prep": 12,
                "slug_categorias": ["ensaladas"],
                "codigo_ingredientes": {"pollo": 0.2, "lechuga": 0.3, "queso_parmesano": 0.05, "huevo": 1, "aceite_oliva": 0.03},
            },
            {
                "nombre": "Café Latte",
                "descripcion": "Café espresso con leche vaporizada",
                "precio": 3500.00,
                "stock": 100,
                "tiempo_prep": 5,
                "slug_categorias": ["bebidas-calientes"],
                "codigo_ingredientes": {"leche": 0.2},
            },
            {
                "nombre": "Chocolate Caliente",
                "descripcion": "Chocolate caliente cremoso con crema de leche",
                "precio": 4000.00,
                "stock": 60,
                "tiempo_prep": 8,
                "slug_categorias": ["bebidas-calientes"],
                "codigo_ingredientes": {"leche": 0.25, "chocolate": 0.05, "crema_leche": 0.03, "azucar": 0.02},
            },
            {
                "nombre": "Helado de Chocolate",
                "descripcion": "Helado artesanal de chocolate belga",
                "precio": 5500.00,
                "stock": 40,
                "tiempo_prep": 2,
                "slug_categorias": ["helados"],
                "codigo_ingredientes": {"leche": 0.15, "chocolate": 0.04, "huevo": 1, "azucar": 0.03, "vainilla": 0.01},
            },
            {
                "nombre": "Torta de Chocolate",
                "descripcion": "Porción de torta de chocolate con baño de ganache",
                "precio": 7500.00,
                "stock": 20,
                "tiempo_prep": 3,
                "slug_categorias": ["tortas"],
                "codigo_ingredientes": {"harina_trigo": 0.1, "huevo": 2, "manteca": 0.05, "chocolate": 0.06, "azucar": 0.05, "vainilla": 0.01},
            },
        ]
        for prod in productos_data:
            result = conn.execute(text("SELECT id FROM productos WHERE nombre = :nombre"), {"nombre": prod["nombre"]})
            existing = result.first()
            if existing:
                print(f"  -> Product already exists: {prod['nombre']}")
                continue
            
            # Insert product
            conn.execute(
                text("INSERT INTO productos (nombre, descripcion, precio, stock, tiempo_preparacion_minutos, activo) VALUES (:nombre, :descripcion, :precio, :stock, :tiempo_prep, TRUE)"),
                {
                    "nombre": prod["nombre"],
                    "descripcion": prod["descripcion"],
                    "precio": prod["precio"],
                    "stock": prod["stock"],
                    "tiempo_prep": prod["tiempo_prep"],
                }
            )
            result = conn.execute(text("SELECT LAST_INSERT_ID()"))
            producto_id = result.scalar()

            # Assign categories
            for cat_slug in prod["slug_categorias"]:
                cat_id = cat_slug_map.get(cat_slug)
                if cat_id:
                    conn.execute(
                        text("INSERT INTO producto_categorias (producto_id, categoria_id) VALUES (:pid, :cid)"),
                        {"pid": producto_id, "cid": cat_id}
                    )

            # Assign ingredients
            for cod_ing, cantidad in prod["codigo_ingredientes"].items():
                ing_id = ing_id_map.get(cod_ing)
                if ing_id:
                    conn.execute(
                        text("INSERT INTO producto_ingredientes (producto_id, ingrediente_id, cantidad) VALUES (:pid, :iid, :cant)"),
                        {"pid": producto_id, "iid": ing_id, "cant": cantidad}
                    )

            print(f"  -> Created product: {prod['nombre']}")

        conn.commit()
        print("\n[OK] All seeds completed!")

if __name__ == "__main__":
    run_seed_sql()
