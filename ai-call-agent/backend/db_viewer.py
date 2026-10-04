"""Interactive SQLite Database Viewer for AI Call Agent (app.db)."""

import sqlite3
import sys

DB_PATH = "app.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def list_tables():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
    tables = [r[0] for r in c.fetchall()]
    print("\n--- Database Tables in app.db ---")
    for t in tables:
        count = c.execute(f"SELECT COUNT(*) FROM \"{t}\"").fetchone()[0]
        print(f"  • {t:<28} : {count} rows")
    print("---------------------------------\n")
    conn.close()

def view_table(table_name, limit=10):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute(f"SELECT * FROM \"{table_name}\" ORDER BY 1 DESC LIMIT {limit}")
        rows = c.fetchall()
        if not rows:
            print(f"Table '{table_name}' is empty.")
            return
        col_names = [description[0] for description in c.description]
        print(f"\n--- {table_name} (Latest {len(rows)} records) ---")
        for i, row in enumerate(rows, 1):
            print(f"\n[Record #{i}]")
            for col in col_names:
                val = row[col]
                if val is not None:
                    print(f"  {col:<24}: {val}")
    except Exception as e:
        print(f"Error querying table {table_name}: {e}")
    finally:
        conn.close()

def query(sql):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute(sql)
        rows = c.fetchall()
        col_names = [d[0] for d in c.description] if c.description else []
        print(f"\nResult ({len(rows)} rows):")
        for row in rows:
            print(" | ".join(f"{col}: {row[col]}" for col in col_names))
    except Exception as e:
        print(f"Query error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) == 1:
        list_tables()
        print("Usage:")
        print("  python db_viewer.py <table_name> [limit]")
        print("  python db_viewer.py --query \"SELECT ...\"")
    elif sys.argv[1] == "--query" and len(sys.argv) > 2:
        query(sys.argv[2])
    else:
        tbl = sys.argv[1]
        lim = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        view_table(tbl, lim)
