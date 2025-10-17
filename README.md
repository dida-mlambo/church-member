# Church Registration System

A comprehensive web-based system for managing church members (believers) and tracking attendance for Sunday and midweek services.

## 🖼️ Interface Preview

### Dashboard
Beautiful overview with statistics, service distribution, and top attendees.

### Features Interface
- **Believers Management**: Add, edit, and track church members
- **Services**: Separate tabs for Sunday ☀️ and Midweek 🌙 services  
- **Attendance Tracking**: Easy checkbox interface with live summary (Present/Absent counts)
- **Reports**: Detailed analytics for believers and services

### Live Demo
To run locally on your computer:
```bash
python app.py
# Then open: http://localhost:8000
```

## Features

### 📊 Dashboard
- Real-time statistics overview
- Total believers count
- Service attendance metrics
- Top attendees tracking
- Service type distribution visualization

### 👥 Believer Management
- Add, edit, and delete church members
- Store contact information (name, email, phone, address)
- Track join dates
- View individual attendance statistics

### 📅 Service Management
- Create and manage services
- Support for Sunday and midweek services
- Track service dates and times
- Add service descriptions
- View attendance count per service

### ✓ Attendance Tracking
- Easy checkbox interface for marking attendance
- Real-time attendance recording
- Prevent duplicate attendance entries
- View who attended each service

### 📈 Reports & Analytics
- Individual believer attendance reports
- Service-specific attendance details
- Breakdown by service type (Sunday vs Midweek)
- Top attendees leaderboard

## Technology Stack

- **Backend**: Python Flask
- **Database**: SQLite (with SQLAlchemy ORM)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Design**: Modern gradient UI with responsive layout

## Installation

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Setup Instructions

1. **Clone or download the project**
   ```bash
   cd church-registration-system
   ```

2. **Create a virtual environment (recommended)**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Open your browser**
   Navigate to: `http://localhost:5000`

The database will be automatically created on the first run.

## Usage Guide

### Adding Believers
1. Navigate to the "Believers" page
2. Click "+ Add Believer"
3. Fill in the member information
4. Click "Save"

### Creating Services
1. Navigate to the "Services" page
2. Click "+ Add Service"
3. Select service type (Sunday or Midweek)
4. Choose date and time
5. Add optional description
6. Click "Save"

### Recording Attendance
1. Navigate to the "Attendance" page
2. Select a service from the dropdown
3. Check the boxes next to believers who attended
4. Attendance is automatically saved

### Viewing Reports
1. Navigate to the "Reports" page
2. **Believer Reports**: Select a member to see their attendance statistics
3. **Service Reports**: Select a service to see who attended

## Database Schema

### Believer
- ID (Primary Key)
- First Name
- Last Name
- Email (unique)
- Phone
- Address
- Date Joined
- Is Active

### Service
- ID (Primary Key)
- Service Type (sunday/midweek)
- Service Date
- Service Time
- Description

### Attendance
- ID (Primary Key)
- Believer ID (Foreign Key)
- Service ID (Foreign Key)
- Attended At (timestamp)
- Notes

## API Endpoints

The system provides a RESTful API:

### Believers
- `GET /api/believers` - List all believers
- `GET /api/believers/:id` - Get believer details
- `POST /api/believers` - Create new believer
- `PUT /api/believers/:id` - Update believer
- `DELETE /api/believers/:id` - Delete believer

### Services
- `GET /api/services` - List all services
- `GET /api/services/:id` - Get service details
- `POST /api/services` - Create new service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Record attendance
- `DELETE /api/attendance/:id` - Remove attendance

### Statistics
- `GET /api/statistics/dashboard` - Dashboard statistics
- `GET /api/statistics/attendance-trends` - Attendance trends
- `GET /api/statistics/top-attendees` - Top attendees list

## Customization

### Colors and Branding
Edit `static/style.css` to customize:
- Gradient colors (`.sidebar`, `.stat-icon`, etc.)
- Font styles
- Layout spacing

### Service Types
To add more service types, modify:
1. `app.py` - Update service type validation if needed
2. `static/index.html` - Add options to service type dropdown
3. `static/style.css` - Add badge styles for new types

## Backup

The SQLite database is stored in `church.db`. To backup your data:
```bash
cp church.db church_backup_$(date +%Y%m%d).db
```

## Troubleshooting

### Database Issues
If you encounter database errors, try:
```bash
rm church.db
python app.py  # This will create a fresh database
```

### Port Already in Use
If port 5000 is already in use, modify the last line in `app.py`:
```python
app.run(debug=True, port=5001)  # Change to any available port
```

## Security Notes

⚠️ This is a basic implementation suitable for internal church use. For production deployment:
- Add user authentication
- Implement access control
- Use HTTPS
- Add input validation and sanitization
- Use a production-grade database (PostgreSQL, MySQL)
- Set `debug=False` in `app.py`

## License

This project is provided as-is for church administration purposes.

## Support

For issues or questions, please refer to the code comments or modify according to your needs.

---

Made with ❤️ for church community management

