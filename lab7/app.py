"""
Лабораторна робота №7 — Варіант 16
Захист від SQL ін'єкцій та XSS атак
Сервер: Flask + SQLite (параметризовані запити — аналог mysqli_prepare)
"""

from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import re
import os
import html
from datetime import datetime

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH  = os.path.join(BASE_DIR, 'messages.db')


# ── Ініціалізація БД ─────────────────────────────────────
def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_name  TEXT NOT NULL,
            sender_email TEXT NOT NULL,
            subject      TEXT NOT NULL,
            message      TEXT NOT NULL,
            priority     TEXT NOT NULL DEFAULT 'normal',
            created_at   TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()
    print(f"[DB] База даних '{DB_PATH}' готова.")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ── XSS-захист: екранування HTML ────────────────────────
def xss_clean(value: str) -> str:
    """
    Аналог htmlspecialchars() з PHP.
    Перетворює небезпечні HTML-символи в безпечні сутності.
    """
    return html.escape(str(value), quote=True)


# ── Додаткова фільтрація SQL-небезпечних символів ────────
def sql_clean(value: str) -> str:
    """
    Додатковий рівень: видаляємо ';' та '--' на сервері,
    навіть якщо JS їх не заблокував (defense in depth).
    """
    value = value.replace(';', '')
    value = re.sub(r'--+', '', value)
    return value


# ── Серверна валідація ────────────────────────────────────
def validate_message(data: dict) -> list:
    errors = []

    name = data.get('sender_name', '').strip()
    if len(name) < 2:
        errors.append("Ім'я має містити мінімум 2 символи.")

    email = data.get('sender_email', '').strip()
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        errors.append("Введіть коректну email адресу.")

    subject = data.get('subject', '').strip()
    if len(subject) < 3:
        errors.append("Тема має містити мінімум 3 символи.")

    message = data.get('message', '').strip()
    if len(message) < 10:
        errors.append("Повідомлення має містити мінімум 10 символів.")

    priority = data.get('priority', 'normal')
    if priority not in ('low', 'normal', 'high'):
        errors.append("Недійсний пріоритет.")

    return errors


# ── Роути ────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/js/<path:filename>')
def js_files(filename):
    return send_from_directory(BASE_DIR, filename)


@app.route('/api/messages', methods=['GET'])
def get_messages():
    """Параметризований SELECT — аналог mysqli_prepare + bind_result."""
    conn = get_db()
    # Параметризований запит: навіть якщо зловмисник потрапить сюди —
    # дані передаються окремо від SQL-команди
    rows = conn.execute(
        'SELECT * FROM messages ORDER BY id DESC'
    ).fetchall()
    conn.close()
    return jsonify({'status': 'success', 'messages': [dict(r) for r in rows]})


@app.route('/api/messages', methods=['POST'])
def add_message():
    """
    Безпечне збереження повідомлення:
    1. Серверна валідація
    2. Очищення від ; та -- (sql_clean)
    3. XSS-екранування (xss_clean / html.escape)
    4. Параметризований INSERT (аналог mysqli_prepare + bind_param)
    """
    data = request.get_json() if request.is_json else request.form.to_dict()

    # Крок 1: валідація
    errors = validate_message(data)
    if errors:
        return jsonify({'status': 'error', 'errors': errors}), 400

    # Крок 2: очищення SQL-небезпечних символів
    name    = sql_clean(data['sender_name'].strip())
    email   = sql_clean(data['sender_email'].strip())
    subject = sql_clean(data['subject'].strip())
    message = sql_clean(data['message'].strip())
    priority= data.get('priority', 'normal')

    # Крок 3: XSS-захист (екранування HTML)
    name    = xss_clean(name)
    subject = xss_clean(subject)
    message = xss_clean(message)

    now = datetime.now().strftime('%d.%m.%Y %H:%M:%S')

    # Крок 4: параметризований INSERT (аналог mysqli_prepare)
    # Знаки '?' — це placeholders, дані передаються окремим аргументом
    # SQLite ніколи не змішує SQL-код з даними
    conn   = get_db()
    cursor = conn.execute(
        '''INSERT INTO messages
           (sender_name, sender_email, subject, message, priority, created_at)
           VALUES (?, ?, ?, ?, ?, ?)''',
        (name, email, subject, message, priority, now)   # ← дані передаються окремо
    )
    conn.commit()
    new_id = cursor.lastrowid
    row    = conn.execute('SELECT * FROM messages WHERE id = ?', (new_id,)).fetchone()
    conn.close()

    print(f"[DB] [{now}] INSERT id={new_id} | від: {name} | тема: {subject}")

    return jsonify({
        'status':  'success',
        'message': f"Повідомлення від '{name}' збережено (id={new_id}).",
        'data':    dict(row)
    }), 201


@app.route('/api/messages/<int:msg_id>', methods=['DELETE'])
def delete_message(msg_id):
    """Параметризований DELETE."""
    conn = get_db()
    row  = conn.execute('SELECT * FROM messages WHERE id = ?', (msg_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'status': 'error', 'message': 'Повідомлення не знайдено.'}), 404

    conn.execute('DELETE FROM messages WHERE id = ?', (msg_id,))
    conn.commit()
    conn.close()
    print(f"[DB] DELETE id={msg_id}")
    return jsonify({'status': 'success', 'message': 'Повідомлення видалено.'})


if __name__ == '__main__':
    init_db()
    print("=" * 55)
    print("  Лабораторна робота №7 | Варіант 16")
    print("  Захист від SQL ін'єкцій та XSS атак")
    print("  БД: SQLite → messages.db")
    print("  Сервер: http://127.0.0.1:5000")
    print("=" * 55)
    app.run(debug=True, port=5000, use_reloader=False)
