"""
Лабораторна робота №6 — Варіант 16
Серверна обробка форми додавання товару (Flask + SQLite)
"""

from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import re
import os
from datetime import datetime

app = Flask(__name__)

# Базова директорія — папка де знаходиться app.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DB_PATH = os.path.join(BASE_DIR, 'products.db')


# ── Ініціалізація БД ─────────────────────────────────
def init_db():
    """Створює таблицю products, якщо вона ще не існує."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            category    TEXT    NOT NULL,
            price       REAL    NOT NULL,
            quantity    INTEGER NOT NULL,
            sku         TEXT,
            brand       TEXT,
            in_stock    INTEGER NOT NULL DEFAULT 1,
            description TEXT    NOT NULL,
            created_at  TEXT    NOT NULL
        )
    ''')
    conn.commit()
    conn.close()
    print(f"[DB] База даних '{DB_PATH}' готова до роботи.")


def get_db():
    """Повертає з'єднання з SQLite, рядки як словники."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ── Валідація ────────────────────────────────────────
def validate_product(data):
    errors = []

    if len(data.get('name', '').strip()) < 2:
        errors.append("Назва товару має містити мінімум 2 символи.")

    if not data.get('category', '').strip():
        errors.append("Категорія товару обов'язкова.")

    try:
        if float(data.get('price', 0)) <= 0:
            errors.append("Ціна повинна бути більше 0.")
    except (ValueError, TypeError):
        errors.append("Ціна має бути числом.")

    try:
        if int(data.get('quantity', 0)) < 1:
            errors.append("Кількість має бути цілим числом (мінімум 1).")
    except (ValueError, TypeError):
        errors.append("Кількість має бути цілим числом.")

    if len(data.get('description', '').strip()) < 10:
        errors.append("Опис товару має містити мінімум 10 символів.")

    sku = data.get('sku', '').strip()
    if sku and not re.match(r'^[A-Za-z0-9\-]{3,20}$', sku):
        errors.append("Артикул: 3–20 символів, лише латинські літери, цифри та дефіс.")

    return errors


# ── Роути ────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/js/<path:filename>')
def js_files(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'js'), filename)


@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db()
    rows = conn.execute('SELECT * FROM products ORDER BY id DESC').fetchall()
    conn.close()
    products = [dict(r) for r in rows]
    for p in products:
        p['in_stock'] = bool(p['in_stock'])
    return jsonify({'status': 'success', 'count': len(products), 'products': products})


@app.route('/api/products', methods=['POST'])
def add_product():
    if request.is_json:
        data = request.get_json()
    else:
        data = {k: request.form.get(k, '') for k in
                ['name','category','price','quantity','sku','description','brand','inStock']}

    errors = validate_product(data)
    if errors:
        return jsonify({'status': 'error', 'errors': errors}), 400

    now      = datetime.now().strftime('%d.%m.%Y %H:%M:%S')
    in_stock = str(data.get('inStock', 'false')).lower() in ('true', '1', 'on')

    conn   = get_db()
    cursor = conn.execute(
        '''INSERT INTO products
           (name, category, price, quantity, sku, brand, in_stock, description, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (
            data['name'].strip(),
            data['category'].strip(),
            round(float(data['price']), 2),
            int(data['quantity']),
            data.get('sku','').strip() or None,
            data.get('brand','').strip() or None,
            1 if in_stock else 0,
            data['description'].strip(),
            now
        )
    )
    conn.commit()
    new_id = cursor.lastrowid
    row    = conn.execute('SELECT * FROM products WHERE id = ?', (new_id,)).fetchone()
    conn.close()

    product = dict(row)
    product['in_stock'] = bool(product['in_stock'])

    print(f"[DB] [{now}] INSERT id={new_id} | '{product['name']}' | {product['price']} грн")

    return jsonify({
        'status':  'success',
        'message': f"Товар '{product['name']}' збережено в БД (id={new_id}).",
        'product': product
    }), 201


@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    conn = get_db()
    row  = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'status': 'error', 'message': 'Товар не знайдено.'}), 404

    name = row['name']
    conn.execute('DELETE FROM products WHERE id = ?', (product_id,))
    conn.commit()
    conn.close()
    print(f"[DB] DELETE id={product_id} | '{name}'")
    return jsonify({'status': 'success', 'message': f"Товар '{name}' видалено з бази даних."})


@app.route('/api/products/stats', methods=['GET'])
def get_stats():
    conn = get_db()
    row  = conn.execute(
        'SELECT COUNT(*) as count, ROUND(SUM(price * quantity), 2) as total FROM products'
    ).fetchone()
    conn.close()
    return jsonify({'status': 'success', 'count': row['count'], 'total': row['total'] or 0.0})


if __name__ == '__main__':
    init_db()
    print("=" * 55)
    print("  Лабораторна робота №6 | Варіант 16")
    print("  База даних: SQLite → products.db")
    print("  Сервер: http://127.0.0.1:5000")
    print("=" * 55)
    app.run(debug=True, port=5000, use_reloader=False)