"""Fix MySQL schema - drop ALL tables and recreate from SQLModel models.
Run this from the backend directory with:
    python fix_schema.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text

DATABASE_URL = "mysql+mysqlconnector://root@localhost:3306/foodstore"

print("Conectando a MySQL...")
engine = create_engine(DATABASE_URL)

# Dropear TODAS las tablas para evitar problemas de engine/foreign keys
with engine.connect() as conn:
    print("Dropando TODAS las tablas...")
    conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
    
    # Obtener todas las tablas
    result = conn.execute(text("SHOW TABLES"))
    tables = [row[0] for row in result]
    print(f"  Tablas encontradas: {tables}")
    
    for table in tables:
        conn.execute(text(f"DROP TABLE IF EXISTS `{table}`"))
        print(f"  ✗ {table} dropeda")
    
    conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
    conn.commit()
    print("[OK] Todas las tablas dropadas exitosamente")

print("\nImportando modelos SQLModel directamente...")
import importlib.util
model_paths = {
    "features/auth/models.py": ["Usuario", "Rol", "UsuarioRol", "RefreshToken"],
    "features/orders/models.py": ["Pedido", "HistorialEstadoPedido"],
    "features/addresses/models.py": ["DireccionEntrega"],
    "features/categories/models.py": ["Categoria"],
    "features/ingredients/models.py": ["Ingrediente"],
    "features/products/models.py": ["Producto", "ProductoCategoria", "ProductoIngrediente"],
    "features/payments/models.py": ["FormaPago"],
}

for rel_path, class_names in model_paths.items():
    abs_path = str(Path(__file__).parent / rel_path)
    if Path(abs_path).exists():
        spec = importlib.util.spec_from_file_location(f"models_{rel_path.replace('/', '_').replace('.py', '')}", abs_path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        print(f"  ✓ {rel_path}")
    else:
        print(f"  - {rel_path} (no encontrado, se omite)")

# Ahora importar SQLModel metadata y crear tablas
from sqlmodel import SQLModel
print("\nRecreando tablas con SQLModel.metadata.create_all()...")
SQLModel.metadata.create_all(engine)
print("[OK] Tablas recreadas exitosamente!")

# Verificar que las tablas se crearon
with engine.connect() as conn:
    result = conn.execute(text("SHOW TABLES"))
    tables = [row[0] for row in result]
    print(f"\nTablas creadas: {tables}")

print("\n" + "="*50)
print("✅ SCHEMA ARREGLADO!")
print("="*50)
print("\nAhora ejecutá los seeds para tener datos iniciales:")
print("   python run_seeds.py")
print("\nY reiniciá el servidor para probar el register.")
