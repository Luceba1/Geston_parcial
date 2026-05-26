"""Simple seed script using raw SQL - run from backend directory with venv activated"""
from sqlalchemy import create_engine, text
from backend.config import get_settings

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
            ("en_camino", "Pedido en camino (repartidor)", 4),
            ("entregado", "Pedido entregado al cliente", 5),
            ("cancelado", "Pedido cancelado", 6),
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
        
        conn.commit()
        print("\n[OK] All seeds completed!")

if __name__ == "__main__":
    run_seed_sql()
