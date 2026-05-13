"""
Migración manual: agrega columnas faltantes a pedidos y crea tabla detalles_pedido.
Ejecutar con el venv activado desde la carpeta backend/:
    python migrate_schema.py
"""
import mysql.connector
from config import get_settings
settings = get_settings()

def run():
    conn = mysql.connector.connect(
        host="localhost",
        port=3306,
        user="root",
        password="",
        database="foodstore",
    )
    cursor = conn.cursor()

    print("✅ Conectado a MySQL foodstore")

    # 1. Agregar forma_pago_id a pedidos (si no existe)
    try:
        cursor.execute("""
            ALTER TABLE pedidos 
            ADD COLUMN forma_pago_id INT NULL,
            ADD CONSTRAINT fk_pedidos_forma_pago 
            FOREIGN KEY (forma_pago_id) REFERENCES formas_pago(id)
        """)
        print("✅ Columna forma_pago_id agregada a pedidos")
    except mysql.connector.errors.DatabaseError as e:
        if "Duplicate column" in str(e):
            print("ℹ️ forma_pago_id ya existe en pedidos")
        else:
            raise

    # 2. Agregar direccion_snapshot a pedidos (si no existe)
    try:
        cursor.execute("""
            ALTER TABLE pedidos 
            ADD COLUMN direccion_snapshot VARCHAR(2000) NULL
        """)
        print("✅ Columna direccion_snapshot agregada a pedidos")
    except mysql.connector.errors.DatabaseError as e:
        if "Duplicate column" in str(e):
            print("ℹ️ direccion_snapshot ya existe en pedidos")
        else:
            raise

    # 3. Crear tabla detalles_pedido (si no existe)
    try:
        cursor.execute("""
            CREATE TABLE detalles_pedido (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pedido_id INT NOT NULL,
                producto_id INT NOT NULL,
                nombre_snapshot VARCHAR(200) NOT NULL,
                precio_snapshot FLOAT NOT NULL,
                cantidad INT NOT NULL DEFAULT 1,
                excluded_ingredient_ids VARCHAR(500) NULL,
                personalizacion_snapshot VARCHAR(1000) NULL,
                FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
                FOREIGN KEY (producto_id) REFERENCES productos(id)
            )
        """)
        print("✅ Tabla detalles_pedido creada")
    except mysql.connector.errors.DatabaseError as e:
        if "already exists" in str(e):
            print("ℹ️ Tabla detalles_pedido ya existe")
        else:
            raise

    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Migración completada exitosamente")

if __name__ == "__main__":
    run()
