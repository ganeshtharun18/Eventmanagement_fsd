from flask import Flask, request, jsonify, make_response, send_from_directory
from flask_cors import CORS
import sqlite3
import hashlib
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
import pandas as pd
from io import BytesIO
import requests
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"], 
        "allow_headers": ["x-admin-secret","x-username", "Content-Type"],
        "methods": ["GET", "POST","DELETE","OPTIONS","PUT"]
    }
})


# Configuration
DB_NAME = "event_management.db"
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
ADMIN_SECRET = os.getenv('ADMIN_SECRET')

# In app.py (temporarily add this)
print(f"!!! DEBUG: ADMIN_SECRET = '{ADMIN_SECRET}'")  # Check if it matches your expectation

# Database setup
def create_tables():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT
    )
    """)
    
    # Events table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Description TEXT NOT NULL,
        Date TEXT NOT NULL,
        Time TEXT NOT NULL,
        Location TEXT NOT NULL,
        username TEXT NOT NULL,
        reminder_sent INTEGER DEFAULT 0,
        FOREIGN KEY (username) REFERENCES users (username)
    )
    """)
    
    # Announcements table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT NOT NULL
    )
    """)
    
    # Categories tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#007bff'
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS event_categories (
        event_id INTEGER,
        category_id INTEGER,
        PRIMARY KEY (event_id, category_id),
        FOREIGN KEY (event_id) REFERENCES events (id),
        FOREIGN KEY (category_id) REFERENCES categories (id)
    )
    """)
    
    conn.commit()
    conn.close()

# Helper functions
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def get_current_user(request):
    return request.headers.get('X-Username')

def is_admin(request):
    return request.headers.get('X-Admin-Token') == ADMIN_SECRET

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'C:\Users\Ganesh\Desktop\fsd_event_ms\frontend\public\index.html')

@app.route('/admin/verify-token', methods=['POST'])
def verify_token():
    # Get the token from frontend
    frontend_token = request.json.get('token')
    
    # Compare with your actual secret (from environment variables)
    if frontend_token == os.environ.get('ADMIN_SECRET_KEY'):
        # Generate a temporary session token
        session_token = generate_secure_token()  # Implement this
        return jsonify({"status": "success", "token": session_token})
    else:
        return jsonify({"status": "error"}), 403
    
    

# User Authentication Endpoints
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    role = data.get('role', 'User')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password, role, email) VALUES (?, ?, ?, ?)",
            (username, hash_password(password), role, email)
        )
        conn.commit()
        return jsonify({'success': True, 'message': 'Registration successful'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username already exists'}), 400
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute(html
        "SELECT username, role FROM users WHERE username = ? AND password = ?",
        (username, hash_password(password))
    )
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'success': True,
            'username': user[0],
            'role': user[1]
        })
    return jsonify({'error': 'Invalid credentials'}), 401

# Event Endpoints
@app.route('/api/events', methods=['GET'])
def get_events():
    username = request.args.get('username')
    role = request.args.get('role')
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    if role == "Admin":
        cursor.execute("""
        SELECT e.*, GROUP_CONCAT(c.name) as categories
        FROM events e
        LEFT JOIN event_categories ec ON e.ID = ec.event_id
        LEFT JOIN categories c ON ec.category_id = c.id
        GROUP BY e.ID
        """)
    else:
        cursor.execute("""
        SELECT e.*, GROUP_CONCAT(c.name) as categories
        FROM events e
        LEFT JOIN event_categories ec ON e.ID = ec.event_id
        LEFT JOIN categories c ON ec.category_id = c.id
        WHERE e.username = ?
        GROUP BY e.ID
        """, (username,))
    
    events = []
    for row in cursor.fetchall():
        events.append({
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'date': row[3],
            'time': row[4],
            'location': row[5],
            'username': row[6],
            'categories': row[8].split(',') if row[8] else []
        })
    
    conn.close()
    return jsonify(events)

@app.route('/api/events', methods=['POST'])
def add_event():
    data = request.get_json()
    required_fields = ['name', 'description', 'date', 'time', 'location', 'username']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Check for date conflict
    cursor.execute("SELECT * FROM events WHERE Date = ?", (data['date'],))
    if cursor.fetchall():
        conn.close()
        return jsonify({'error': 'Event already exists on this date'}), 400
    
    cursor.execute("""
    INSERT INTO events (Name, Description, Date, Time, Location, username)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data['name'],
        data['description'],
        data['date'],
        data['time'],
        data['location'],
        data['username']
    ))
    
    event_id = cursor.lastrowid
    
    # Add categories if provided
    if 'categories' in data:
        for category_id in data['categories']:
            try:
                cursor.execute(
                    "INSERT INTO event_categories (event_id, category_id) VALUES (?, ?)",
                    (event_id, category_id)
                )
            except sqlite3.IntegrityError:
                pass
    
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Event added successfully', 'id': event_id}), 201

@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    if not is_admin(request):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE events
        SET Name = ?, Description = ?, Date = ?, Time = ?, Location = ?
        WHERE ID = ?
    """, (
        data.get('name'),
        data.get('description'),
        data.get('date'),
        data.get('time'),
        data.get('location'),
        event_id
    ))

    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Event not found'}), 404

    # Update categories
    if 'categories' in data:
        cursor.execute("DELETE FROM event_categories WHERE event_id = ?", (event_id,))
        for category_id in data['categories']:
            try:
                cursor.execute(
                    "INSERT INTO event_categories (event_id, category_id) VALUES (?, ?)",
                    (event_id, category_id)
                )
            except sqlite3.IntegrityError:
                continue

    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Event updated successfully'})


@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    if not is_admin(request):
        return jsonify({'error': 'Unauthorized'}), 403

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM event_categories WHERE event_id = ?", (event_id,))
    cursor.execute("DELETE FROM events WHERE ID = ?", (event_id,))

    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Event not found'}), 404

    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Event deleted successfully'})


# Admin Endpoints
@app.route('/api/admin/users')
def admin_users():
    expected_secret = os.getenv('ADMIN_SECRET')
    received_secret = request.headers.get('X-Admin-Secret')
    
    print(f"🔑 Expected: {expected_secret}")
    print(f"📩 Received: {received_secret}")
    
    if received_secret != expected_secret:
        return jsonify({"error": "Invalid admin secret"}), 403
    
    conn = None  # Initialize conn outside try block
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT username, role, email FROM users")
        users = [{'username': row[0], 'role': row[1], 'email': row[2]} for row in cursor.fetchall()]
        return jsonify(users)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:  # Only close if conn was successfully created
            conn.close()

@app.route('/api/admin/users/<username>', methods=['PUT'])
def update_user_role(username):
    if not is_admin(request):
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    new_role = data.get('role')
    
    if new_role not in ['Admin', 'User']:
        return jsonify({'error': 'Invalid role'}), 400
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET role = ? WHERE username = ?",
        (new_role, username)
    )
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    conn.close()
    return jsonify({'success': True, 'message': 'User role updated'})
@app.route('/api/admin/users/<username>', methods=['DELETE'])
def delete_user(username):
    if not is_admin(request):
        return jsonify({'error': 'Unauthorized'}), 403

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Check if user exists first
    cursor.execute("SELECT 1 FROM users WHERE username = ?", (username,))
    user_exists = cursor.fetchone()

    if not user_exists:
        conn.close()
        return jsonify({'error': 'User not found'}), 404

    # Delete related events and then the user
    cursor.execute("DELETE FROM events WHERE username = ?", (username,))
    cursor.execute("DELETE FROM users WHERE username = ?", (username,))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': f'User {username} and related events deleted'})


# Announcements Endpoints
# POST: Create Announcement (Only Admin)
def is_admin(request):
    return request.headers.get('x-admin-secret') == ADMIN_SECRET


# Utility: Get current user (optional improvement)
def get_current_user(request):
    return request.headers.get('x-username') or "admin"  # Fallback for testing


# POST: Create Announcement (Admin only)
@app.route('/api/announcements', methods=['POST'])
def create_announcement():
    if not is_admin(request):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    if not data or not data.get('title') or not data.get('content'):
        return jsonify({'error': 'Title and content required'}), 400

    created_by = get_current_user(request)

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO announcements (title, content, created_by)
        VALUES (?, ?, ?)
    """, (data['title'], data['content'], created_by))
    
    announcement_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'message': 'Announcement created successfully',
        'id': announcement_id,
        'title': data['title'],
        'content': data['content'],
        'created_by': created_by
    })


# GET: Fetch Recent Announcements (Everyone)
@app.route('/api/announcements', methods=['GET'])
def get_announcements():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.id, a.title, a.content, a.created_at,
               COALESCE(u.username, a.created_by) AS creator
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.username
        ORDER BY a.created_at DESC
        LIMIT 10
    """)
    
    announcements = []
    for row in cursor.fetchall():
        announcements.append({
            'id': row[0],
            'title': row[1],
            'content': row[2],
            'created_at': row[3],
            'created_by': row[4]
        })
    conn.close()

    return jsonify(announcements)


# Categories Endpoints
@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, color FROM categories")
    categories = [{'id': row[0], 'name': row[1], 'color': row[2]} for row in cursor.fetchall()]
    conn.close()
    return jsonify(categories)

@app.route('/api/categories', methods=['POST'])
def create_category():
    if not is_admin(request):
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO categories (name, color)
        VALUES (?, ?)
        """, (data['name'], data.get('color', '#007bff')))
        category_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'id': category_id})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Category already exists'}), 400

# Analytics Endpoints
@app.route('/api/analytics/events', methods=['GET'])
def get_event_analytics():
    if not is_admin(request):
        return jsonify({'error': 'Unauthorized'}), 403
    
    time_range = request.args.get('range', 'monthly')
    
    # Determine time format based on range
    if time_range == 'daily':
        time_format = "%Y-%m-%d"
    elif time_range == 'weekly':
        time_format = "%Y-%W"
    elif time_range == 'monthly':
        time_format = "%Y-%m"
    elif time_range == 'yearly':
        time_format = "%Y"
    else:
        return jsonify({'error': 'Invalid time range'}), 400
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Events by time period
    cursor.execute(f"""
    SELECT strftime('{time_format}', Date) as period, COUNT(*) as count 
    FROM events 
    GROUP BY period 
    ORDER BY period
    """)
    events_by_time = [{'period': row[0], 'count': row[1]} for row in cursor.fetchall()]
    
    # User participation
    cursor.execute("""
    SELECT username, COUNT(*) as events 
    FROM events 
    GROUP BY username 
    ORDER BY events DESC
    LIMIT 5
    """)
    top_users = [{'username': row[0], 'events': row[1]} for row in cursor.fetchall()]
    
    # Category stats
    cursor.execute("""
    SELECT c.name, COUNT(ec.event_id) as count 
    FROM categories c
    LEFT JOIN event_categories ec ON c.id = ec.category_id
    GROUP BY c.name
    ORDER BY count DESC
    """)
    category_stats = [{'name': row[0], 'count': row[1]} for row in cursor.fetchall()]
    
    # Location stats
    cursor.execute("""
    SELECT Location, COUNT(*) as count 
    FROM events 
    GROUP BY Location 
    ORDER BY count DESC
    LIMIT 5
    """)
    location_stats = [{'location': row[0], 'count': row[1]} for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify({
        'events_by_time': events_by_time,
        'top_users': top_users,
        'category_stats': category_stats,
        'location_stats': location_stats,
        'total_events': sum(item['count'] for item in events_by_time),
        'total_users': len(top_users),
        'total_categories': len(category_stats)
    })

# Export Endpoints

@app.route('/api/export/events/excel', methods=['GET'])
def export_events_excel():
    if not is_admin(request):
        return jsonify({'error': 'Unauthorized'}), 403

    conn = sqlite3.connect(DB_NAME)
    df = pd.read_sql_query("""
        SELECT e.ID, e.Name, e.Description, e.Date, e.Time, e.Location, u.username as Organizer,
               GROUP_CONCAT(c.name) as Categories
        FROM events e
        JOIN users u ON e.username = u.username
        LEFT JOIN event_categories ec ON e.ID = ec.event_id
        LEFT JOIN categories c ON ec.category_id = c.id
        GROUP BY e.ID
    """, conn)
    conn.close()

    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Events')
    output.seek(0)

    response = make_response(output.read())
    response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    response.headers['Content-Disposition'] = 'attachment; filename=events.xlsx'
    return response

@app.route('/api/export/events/pdf', methods=['GET'])
def export_events_pdf():
    if not is_admin(request):
        return jsonify({'error': 'Unauthorized'}), 403

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT e.ID, e.Name, e.Date, e.Time, e.Location, u.username
        FROM events e
        JOIN users u ON e.username = u.username
        ORDER BY e.Date
    """)
    events = cursor.fetchall()
    conn.close()

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    data = [['ID', 'Name', 'Date', 'Time', 'Location', 'Organizer']]
    data.extend([list(map(str, row)) for row in events])

    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))

    doc.build([table])
    buffer.seek(0)

    response = make_response(buffer.read())
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = 'attachment; filename=events.pdf'
    return response

# Reminder Service
from datetime import datetime
import sqlite3
from flask import Flask
from io import BytesIO

DB_NAME = "event_management.db"

def check_upcoming_events():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Ensure date is in YYYY-MM-DD format
    cursor.execute("""
        SELECT e.ID, e.Name, e.Description, e.Date, e.Time, e.Location, e.username, e.reminder_sent, u.email 
        FROM events e
        JOIN users u ON e.username = u.username
        WHERE date(e.Date) = date('now', '+1 day')
        AND e.reminder_sent = 0
        AND u.email IS NOT NULL
    """)
    
    upcoming_events = cursor.fetchall()
    
    if not upcoming_events:
        print("✅ No upcoming events found for tomorrow.")
    else:
        print(f"📅 Found {len(upcoming_events)} upcoming events for tomorrow.\n")

    for event in upcoming_events:
        send_event_reminder(event)
        
        # Mark reminder as sent
        cursor.execute("UPDATE events SET reminder_sent = 1 WHERE ID = ?", (event[0],))

    conn.commit()
    conn.close()


def send_event_reminder(event):
    event_id, name, desc, date, time, location, username, reminder_sent, email = event
    
    subject = f"Reminder: {name} is happening tomorrow"
    content = f"""
    📢 Event Reminder:
    --------------------------
    Title      : {name}
    Date       : {date} at {time}
    Location   : {location}
    Description: {desc}
    --------------------------
    """

    # Replace this print with real email logic
    print(f"📬 Sending reminder to {email} for event '{name}' on {date} at {time}\n")
    
    # Example placeholder for real email integration:
    # if SENDGRID_API_KEY:
    #     send_email(email, subject, content)


def send_announcement_emails(title, content, recipients):
    # Pseudo-code for sending announcement emails
    if SENDGRID_API_KEY:
        for email in recipients:
            print(f"Would send announcement '{title}' to {email}")

# Initialize scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(func=check_upcoming_events, trigger="interval", hours=24)
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

@app.route('/api/upcoming-events/<username>', methods=['GET'])
def get_upcoming_events(username):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ID, Name, Description, Date, Time, Location 
        FROM events
        WHERE username = ?
        AND datetime(Date || 'T' || Time) BETWEEN datetime('now') AND datetime('now', '+1 day')
        AND reminder_sent = 0
    """, (username,))
    
    events = [{
        'id': row[0],
        'name': row[1],
        'description': row[2],
        'date': row[3],
        'time': row[4],
        'location': row[5]
    } for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(events)


@app.route('/api/admin/events/bulk', methods=['POST', 'OPTIONS'])
def bulk_event_action():
    if request.method == 'OPTIONS':
        return '', 204  # Handle preflight

    if not is_admin(request):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    event_ids = data.get('event_ids', [])
    action = data.get('action')

    if not event_ids or action not in ['delete', 'update']:
        return jsonify({'error': 'Invalid request'}), 400

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    if action == 'delete':
        for event_id in event_ids:
            cursor.execute("DELETE FROM event_categories WHERE event_id = ?", (event_id,))
            cursor.execute("DELETE FROM events WHERE ID = ?", (event_id,))
    elif action == 'update':
        new_location = data.get('new_location')
        if not new_location:
            return jsonify({'error': 'New location required'}), 400
        for event_id in event_ids:
            cursor.execute("UPDATE events SET Location = ? WHERE ID = ?", (new_location, event_id))

    conn.commit()
    conn.close()

    return jsonify({'success': True, 'affected': len(event_ids)})


# Initialize database and start app
if __name__ == '__main__':
    create_tables()
    app.run(debug=True)