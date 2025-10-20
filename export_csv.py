import sqlite3
import csv
from pathlib import Path

db_path = "/home/carlos/Descargas/Practicas/bas/estudiantes.db"
output_dir = Path("/home/carlos/Descargas/Practicas/bas/csv_export")
output_dir.mkdir(exist_ok=True)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Obtener lista de tablas
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
tables = [row[0] for row in cursor.fetchall()]

print(f"📊 Exportando {len(tables)} tablas a CSV...\n")

for table in tables:
    # Obtener datos de cada tabla
    cursor.execute(f"SELECT * FROM {table}")
    columns = [description[0] for description in cursor.description]
    rows = cursor.fetchall()
    
    # Guardar a CSV
    csv_file = output_dir / f"{table}.csv"
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(columns)  # Encabezados
        writer.writerows(rows)
    
    print(f"✅ {table}.csv - {len(rows)} registros")

conn.close()
print(f"\n📁 Archivos CSV guardados en: {output_dir}")
