"""
Sample data initialization script for Church Registration System
Run this script to populate the database with sample data for testing
"""

from app import app, db, Believer, Service, Attendance
from datetime import datetime, timedelta
import random

def init_sample_data():
    with app.app_context():
        # Clear existing data
        print("Clearing existing data...")
        Attendance.query.delete()
        Service.query.delete()
        Believer.query.delete()
        db.session.commit()
        
        # Create sample believers
        print("Creating sample believers...")
        believers_data = [
            {"first_name": "John", "last_name": "Smith", "email": "john.smith@example.com", "phone": "555-0101"},
            {"first_name": "Mary", "last_name": "Johnson", "email": "mary.johnson@example.com", "phone": "555-0102"},
            {"first_name": "David", "last_name": "Williams", "email": "david.williams@example.com", "phone": "555-0103"},
            {"first_name": "Sarah", "last_name": "Brown", "email": "sarah.brown@example.com", "phone": "555-0104"},
            {"first_name": "Michael", "last_name": "Davis", "email": "michael.davis@example.com", "phone": "555-0105"},
            {"first_name": "Jennifer", "last_name": "Miller", "email": "jennifer.miller@example.com", "phone": "555-0106"},
            {"first_name": "James", "last_name": "Wilson", "email": "james.wilson@example.com", "phone": "555-0107"},
            {"first_name": "Patricia", "last_name": "Moore", "email": "patricia.moore@example.com", "phone": "555-0108"},
            {"first_name": "Robert", "last_name": "Taylor", "email": "robert.taylor@example.com", "phone": "555-0109"},
            {"first_name": "Linda", "last_name": "Anderson", "email": "linda.anderson@example.com", "phone": "555-0110"},
            {"first_name": "William", "last_name": "Thomas", "email": "william.thomas@example.com", "phone": "555-0111"},
            {"first_name": "Barbara", "last_name": "Jackson", "email": "barbara.jackson@example.com", "phone": "555-0112"},
            {"first_name": "Richard", "last_name": "White", "email": "richard.white@example.com", "phone": "555-0113"},
            {"first_name": "Susan", "last_name": "Harris", "email": "susan.harris@example.com", "phone": "555-0114"},
            {"first_name": "Joseph", "last_name": "Martin", "email": "joseph.martin@example.com", "phone": "555-0115"},
        ]
        
        believers = []
        for data in believers_data:
            believer = Believer(
                first_name=data["first_name"],
                last_name=data["last_name"],
                email=data["email"],
                phone=data["phone"],
                address=f"{random.randint(100, 999)} Main Street, City, State",
                date_joined=(datetime.now() - timedelta(days=random.randint(30, 365))).date()
            )
            believers.append(believer)
            db.session.add(believer)
        
        db.session.commit()
        print(f"Created {len(believers)} believers")
        
        # Create sample services (last 3 months)
        print("Creating sample services...")
        services = []
        current_date = datetime.now().date()
        
        # Create Sunday services (every Sunday for the last 12 weeks)
        for week in range(12):
            service_date = current_date - timedelta(days=current_date.weekday() + 1 + (week * 7))
            service = Service(
                service_type='sunday',
                service_date=service_date,
                service_time='10:00',
                description='Sunday Worship Service'
            )
            services.append(service)
            db.session.add(service)
        
        # Create midweek services (every Wednesday for the last 12 weeks)
        for week in range(12):
            service_date = current_date - timedelta(days=current_date.weekday() - 2 + (week * 7))
            if service_date <= current_date:  # Only past dates
                service = Service(
                    service_type='midweek',
                    service_date=service_date,
                    service_time='19:00',
                    description='Midweek Bible Study'
                )
                services.append(service)
                db.session.add(service)
        
        db.session.commit()
        print(f"Created {len(services)} services")
        
        # Create sample attendance (random attendance for each service)
        print("Creating sample attendance records...")
        attendance_count = 0
        
        for service in services:
            # Randomly select 60-90% of believers to attend each service
            num_attendees = random.randint(int(len(believers) * 0.6), int(len(believers) * 0.9))
            attending_believers = random.sample(believers, num_attendees)
            
            for believer in attending_believers:
                attendance = Attendance(
                    believer_id=believer.id,
                    service_id=service.id,
                    attended_at=datetime.combine(service.service_date, datetime.min.time())
                )
                db.session.add(attendance)
                attendance_count += 1
        
        db.session.commit()
        print(f"Created {attendance_count} attendance records")
        
        print("\n✅ Sample data initialization complete!")
        print(f"📊 Summary:")
        print(f"   - {len(believers)} believers")
        print(f"   - {len(services)} services")
        print(f"   - {attendance_count} attendance records")
        print("\n🚀 You can now start the application with: python app.py")

if __name__ == '__main__':
    init_sample_data()

