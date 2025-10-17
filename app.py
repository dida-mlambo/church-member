from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
from sqlalchemy import func, extract
import os

app = Flask(__name__, static_folder='static')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///church.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)

db = SQLAlchemy(app)

# Models
class Believer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True)
    phone = db.Column(db.String(20))
    address = db.Column(db.String(200))
    date_joined = db.Column(db.Date, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    attendances = db.relationship('Attendance', backref='believer', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'date_joined': self.date_joined.isoformat() if self.date_joined else None,
            'is_active': self.is_active
        }

class Service(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    service_type = db.Column(db.String(20), nullable=False)  # 'sunday' or 'midweek'
    service_date = db.Column(db.Date, nullable=False)
    service_time = db.Column(db.String(10))
    description = db.Column(db.String(200))
    attendances = db.relationship('Attendance', backref='service', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        attendance_count = len(self.attendances)
        return {
            'id': self.id,
            'service_type': self.service_type,
            'service_date': self.service_date.isoformat(),
            'service_time': self.service_time,
            'description': self.description,
            'attendance_count': attendance_count
        }

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    believer_id = db.Column(db.Integer, db.ForeignKey('believer.id'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('service.id'), nullable=False)
    attended_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.String(200))

    def to_dict(self):
        return {
            'id': self.id,
            'believer_id': self.believer_id,
            'service_id': self.service_id,
            'attended_at': self.attended_at.isoformat() if self.attended_at else None,
            'notes': self.notes
        }

# Routes
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('static', path)

# Believer endpoints
@app.route('/api/believers', methods=['GET'])
def get_believers():
    believers = Believer.query.filter_by(is_active=True).all()
    return jsonify([b.to_dict() for b in believers])

@app.route('/api/believers/<int:id>', methods=['GET'])
def get_believer(id):
    believer = Believer.query.get_or_404(id)
    believer_data = believer.to_dict()
    
    # Add attendance statistics
    total_attendance = len(believer.attendances)
    sunday_attendance = db.session.query(Attendance).join(Service).filter(
        Attendance.believer_id == id,
        Service.service_type == 'sunday'
    ).count()
    midweek_attendance = db.session.query(Attendance).join(Service).filter(
        Attendance.believer_id == id,
        Service.service_type == 'midweek'
    ).count()
    
    believer_data['stats'] = {
        'total': total_attendance,
        'sunday': sunday_attendance,
        'midweek': midweek_attendance
    }
    
    return jsonify(believer_data)

@app.route('/api/believers', methods=['POST'])
def create_believer():
    data = request.json
    believer = Believer(
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data.get('email'),
        phone=data.get('phone'),
        address=data.get('address'),
        date_joined=datetime.strptime(data['date_joined'], '%Y-%m-%d').date() if 'date_joined' in data else datetime.utcnow().date()
    )
    db.session.add(believer)
    db.session.commit()
    return jsonify(believer.to_dict()), 201

@app.route('/api/believers/<int:id>', methods=['PUT'])
def update_believer(id):
    believer = Believer.query.get_or_404(id)
    data = request.json
    
    believer.first_name = data.get('first_name', believer.first_name)
    believer.last_name = data.get('last_name', believer.last_name)
    believer.email = data.get('email', believer.email)
    believer.phone = data.get('phone', believer.phone)
    believer.address = data.get('address', believer.address)
    believer.is_active = data.get('is_active', believer.is_active)
    
    db.session.commit()
    return jsonify(believer.to_dict())

@app.route('/api/believers/<int:id>', methods=['DELETE'])
def delete_believer(id):
    believer = Believer.query.get_or_404(id)
    db.session.delete(believer)
    db.session.commit()
    return '', 204

# Service endpoints
@app.route('/api/services', methods=['GET'])
def get_services():
    services = Service.query.order_by(Service.service_date.desc()).all()
    return jsonify([s.to_dict() for s in services])

@app.route('/api/services/<int:id>', methods=['GET'])
def get_service(id):
    service = Service.query.get_or_404(id)
    service_data = service.to_dict()
    
    # Add list of attendees
    attendances = Attendance.query.filter_by(service_id=id).all()
    service_data['attendees'] = []
    for att in attendances:
        believer = Believer.query.get(att.believer_id)
        if believer:
            service_data['attendees'].append({
                'id': believer.id,
                'name': f"{believer.first_name} {believer.last_name}"
            })
    
    return jsonify(service_data)

@app.route('/api/services', methods=['POST'])
def create_service():
    data = request.json
    service = Service(
        service_type=data['service_type'],
        service_date=datetime.strptime(data['service_date'], '%Y-%m-%d').date(),
        service_time=data.get('service_time'),
        description=data.get('description')
    )
    db.session.add(service)
    db.session.commit()
    return jsonify(service.to_dict()), 201

@app.route('/api/services/<int:id>', methods=['PUT'])
def update_service(id):
    service = Service.query.get_or_404(id)
    data = request.json
    
    service.service_type = data.get('service_type', service.service_type)
    if 'service_date' in data:
        service.service_date = datetime.strptime(data['service_date'], '%Y-%m-%d').date()
    service.service_time = data.get('service_time', service.service_time)
    service.description = data.get('description', service.description)
    
    db.session.commit()
    return jsonify(service.to_dict())

@app.route('/api/services/<int:id>', methods=['DELETE'])
def delete_service(id):
    service = Service.query.get_or_404(id)
    db.session.delete(service)
    db.session.commit()
    return '', 204

# Attendance endpoints
@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    service_id = request.args.get('service_id')
    believer_id = request.args.get('believer_id')
    
    query = Attendance.query
    if service_id:
        query = query.filter_by(service_id=service_id)
    if believer_id:
        query = query.filter_by(believer_id=believer_id)
    
    attendances = query.all()
    return jsonify([a.to_dict() for a in attendances])

@app.route('/api/attendance', methods=['POST'])
def create_attendance():
    data = request.json
    
    # Check if attendance already exists
    existing = Attendance.query.filter_by(
        believer_id=data['believer_id'],
        service_id=data['service_id']
    ).first()
    
    if existing:
        return jsonify({'error': 'Attendance already recorded'}), 400
    
    attendance = Attendance(
        believer_id=data['believer_id'],
        service_id=data['service_id'],
        notes=data.get('notes')
    )
    db.session.add(attendance)
    db.session.commit()
    return jsonify(attendance.to_dict()), 201

@app.route('/api/attendance/<int:id>', methods=['DELETE'])
def delete_attendance(id):
    attendance = Attendance.query.get_or_404(id)
    db.session.delete(attendance)
    db.session.commit()
    return '', 204

# Statistics endpoints
@app.route('/api/statistics/dashboard', methods=['GET'])
def get_dashboard_stats():
    total_believers = Believer.query.filter_by(is_active=True).count()
    total_services = Service.query.count()
    
    # Recent services (last 30 days)
    thirty_days_ago = datetime.utcnow().date() - timedelta(days=30)
    recent_services = Service.query.filter(Service.service_date >= thirty_days_ago).count()
    
    # Average attendance
    services_with_attendance = db.session.query(
        Service.id,
        func.count(Attendance.id).label('count')
    ).outerjoin(Attendance).group_by(Service.id).all()
    
    if services_with_attendance:
        avg_attendance = sum(s.count for s in services_with_attendance) / len(services_with_attendance)
    else:
        avg_attendance = 0
    
    # Service type breakdown
    sunday_services = Service.query.filter_by(service_type='sunday').count()
    midweek_services = Service.query.filter_by(service_type='midweek').count()
    
    return jsonify({
        'total_believers': total_believers,
        'total_services': total_services,
        'recent_services': recent_services,
        'average_attendance': round(avg_attendance, 1),
        'sunday_services': sunday_services,
        'midweek_services': midweek_services
    })

@app.route('/api/statistics/attendance-trends', methods=['GET'])
def get_attendance_trends():
    # Get attendance by month for the last 6 months
    six_months_ago = datetime.utcnow().date() - timedelta(days=180)
    
    sunday_trends = db.session.query(
        extract('year', Service.service_date).label('year'),
        extract('month', Service.service_date).label('month'),
        func.count(Attendance.id).label('count')
    ).join(Attendance).filter(
        Service.service_type == 'sunday',
        Service.service_date >= six_months_ago
    ).group_by('year', 'month').all()
    
    midweek_trends = db.session.query(
        extract('year', Service.service_date).label('year'),
        extract('month', Service.service_date).label('month'),
        func.count(Attendance.id).label('count')
    ).join(Attendance).filter(
        Service.service_type == 'midweek',
        Service.service_date >= six_months_ago
    ).group_by('year', 'month').all()
    
    return jsonify({
        'sunday': [{'year': int(t.year), 'month': int(t.month), 'count': t.count} for t in sunday_trends],
        'midweek': [{'year': int(t.year), 'month': int(t.month), 'count': t.count} for t in midweek_trends]
    })

@app.route('/api/statistics/top-attendees', methods=['GET'])
def get_top_attendees():
    limit = request.args.get('limit', 10, type=int)
    
    top_attendees = db.session.query(
        Believer,
        func.count(Attendance.id).label('attendance_count')
    ).join(Attendance).filter(
        Believer.is_active == True
    ).group_by(Believer.id).order_by(
        func.count(Attendance.id).desc()
    ).limit(limit).all()
    
    result = []
    for believer, count in top_attendees:
        result.append({
            'id': believer.id,
            'name': f"{believer.first_name} {believer.last_name}",
            'attendance_count': count
        })
    
    return jsonify(result)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.environ.get('PORT', 8000))
    app.run(debug=True, host='0.0.0.0', port=port)

