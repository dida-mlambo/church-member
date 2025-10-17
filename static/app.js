// API Base URL
const API_BASE = '/api';

// Current state
let currentPage = 'dashboard';
let believers = [];
let services = [];
let currentServiceFilter = 'all';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadDashboard();
    
    // Set today's date as default for date inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('believer-date-joined').value = today;
    document.getElementById('service-date').value = today;
});

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            switchPage(page);
        });
    });
}

function switchPage(page) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    // Update page
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(`${page}-page`).classList.add('active');
    
    currentPage = page;
    
    // Load page data
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'believers':
            loadBelievers();
            break;
        case 'services':
            loadServices();
            break;
        case 'attendance':
            loadAttendancePage();
            break;
        case 'reports':
            loadReportsPage();
            break;
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/statistics/dashboard`);
        const stats = await response.json();
        
        document.getElementById('stat-believers').textContent = stats.total_believers;
        document.getElementById('stat-services').textContent = stats.total_services;
        document.getElementById('stat-avg-attendance').textContent = stats.average_attendance;
        document.getElementById('stat-recent-services').textContent = stats.recent_services;
        
        // Service distribution
        const total = stats.sunday_services + stats.midweek_services;
        const sundayPercent = total > 0 ? (stats.sunday_services / total * 100) : 0;
        const midweekPercent = total > 0 ? (stats.midweek_services / total * 100) : 0;
        
        document.getElementById('sunday-bar').style.width = `${sundayPercent}%`;
        document.getElementById('midweek-bar').style.width = `${midweekPercent}%`;
        document.getElementById('sunday-count').textContent = stats.sunday_services;
        document.getElementById('midweek-count').textContent = stats.midweek_services;
        
        // Top attendees
        const topResponse = await fetch(`${API_BASE}/statistics/top-attendees?limit=5`);
        const topAttendees = await topResponse.json();
        
        const topList = document.getElementById('top-attendees-list');
        if (topAttendees.length === 0) {
            topList.innerHTML = '<p class="info-message">No attendance data yet</p>';
        } else {
            topList.innerHTML = topAttendees.map(attendee => `
                <div class="attendee-item">
                    <span class="attendee-name">${attendee.name}</span>
                    <span class="attendee-count">${attendee.attendance_count} services</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Believers
async function loadBelievers() {
    try {
        const response = await fetch(`${API_BASE}/believers`);
        believers = await response.json();
        
        const tbody = document.getElementById('believers-table-body');
        if (believers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="info-message">No believers registered yet</td></tr>';
        } else {
            tbody.innerHTML = believers.map(believer => `
                <tr>
                    <td>${believer.first_name} ${believer.last_name}</td>
                    <td>${believer.email || '-'}</td>
                    <td>${believer.phone || '-'}</td>
                    <td>${formatDate(believer.date_joined)}</td>
                    <td>
                        <button class="btn btn-info" onclick="editBeliever(${believer.id})">Edit</button>
                        <button class="btn btn-danger" onclick="deleteBeliever(${believer.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading believers:', error);
    }
}

function showBelieverModal() {
    document.getElementById('believer-modal-title').textContent = 'Add Believer';
    document.getElementById('believer-form').reset();
    document.getElementById('believer-id').value = '';
    document.getElementById('believer-date-joined').value = new Date().toISOString().split('T')[0];
    document.getElementById('believer-modal').classList.add('active');
}

function closeBelieverModal() {
    document.getElementById('believer-modal').classList.remove('active');
}

async function editBeliever(id) {
    try {
        const response = await fetch(`${API_BASE}/believers/${id}`);
        const believer = await response.json();
        
        document.getElementById('believer-modal-title').textContent = 'Edit Believer';
        document.getElementById('believer-id').value = believer.id;
        document.getElementById('believer-first-name').value = believer.first_name;
        document.getElementById('believer-last-name').value = believer.last_name;
        document.getElementById('believer-email').value = believer.email || '';
        document.getElementById('believer-phone').value = believer.phone || '';
        document.getElementById('believer-address').value = believer.address || '';
        document.getElementById('believer-date-joined').value = believer.date_joined;
        document.getElementById('believer-modal').classList.add('active');
    } catch (error) {
        console.error('Error loading believer:', error);
        alert('Error loading believer data');
    }
}

async function saveBeliever(event) {
    event.preventDefault();
    
    const id = document.getElementById('believer-id').value;
    const data = {
        first_name: document.getElementById('believer-first-name').value,
        last_name: document.getElementById('believer-last-name').value,
        email: document.getElementById('believer-email').value,
        phone: document.getElementById('believer-phone').value,
        address: document.getElementById('believer-address').value,
        date_joined: document.getElementById('believer-date-joined').value
    };
    
    try {
        const url = id ? `${API_BASE}/believers/${id}` : `${API_BASE}/believers`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeBelieverModal();
            loadBelievers();
        } else {
            alert('Error saving believer');
        }
    } catch (error) {
        console.error('Error saving believer:', error);
        alert('Error saving believer');
    }
}

async function deleteBeliever(id) {
    if (!confirm('Are you sure you want to delete this believer?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/believers/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadBelievers();
        } else {
            alert('Error deleting believer');
        }
    } catch (error) {
        console.error('Error deleting believer:', error);
        alert('Error deleting believer');
    }
}

// Services
async function loadServices() {
    try {
        const response = await fetch(`${API_BASE}/services`);
        services = await response.json();
        displayServices();
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

function displayServices() {
    const tbody = document.getElementById('services-table-body');
    
    // Filter services based on current filter
    let filteredServices = services;
    if (currentServiceFilter !== 'all') {
        filteredServices = services.filter(s => s.service_type === currentServiceFilter);
    }
    
    if (filteredServices.length === 0) {
        const message = currentServiceFilter === 'all' 
            ? 'No services scheduled yet' 
            : `No ${currentServiceFilter} services found`;
        tbody.innerHTML = `<tr><td colspan="6" class="info-message">${message}</td></tr>`;
    } else {
        tbody.innerHTML = filteredServices.map(service => `
            <tr>
                <td>${formatDate(service.service_date)}</td>
                <td><span class="service-type-badge badge-${service.service_type}">${capitalizeFirst(service.service_type)}</span></td>
                <td>${service.service_time || '-'}</td>
                <td>${service.description || '-'}</td>
                <td>${service.attendance_count}</td>
                <td>
                    <button class="btn btn-info" onclick="editService(${service.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteService(${service.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    }
}

function filterServices(type) {
    currentServiceFilter = type;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        }
    });
    
    displayServices();
}

function showServiceModal() {
    document.getElementById('service-modal-title').textContent = 'Add Service';
    document.getElementById('service-form').reset();
    document.getElementById('service-id').value = '';
    document.getElementById('service-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('service-modal').classList.add('active');
}

function closeServiceModal() {
    document.getElementById('service-modal').classList.remove('active');
}

async function editService(id) {
    try {
        const response = await fetch(`${API_BASE}/services/${id}`);
        const service = await response.json();
        
        document.getElementById('service-modal-title').textContent = 'Edit Service';
        document.getElementById('service-id').value = service.id;
        document.getElementById('service-type').value = service.service_type;
        document.getElementById('service-date').value = service.service_date;
        document.getElementById('service-time').value = service.service_time || '';
        document.getElementById('service-description').value = service.description || '';
        document.getElementById('service-modal').classList.add('active');
    } catch (error) {
        console.error('Error loading service:', error);
        alert('Error loading service data');
    }
}

async function saveService(event) {
    event.preventDefault();
    
    const id = document.getElementById('service-id').value;
    const data = {
        service_type: document.getElementById('service-type').value,
        service_date: document.getElementById('service-date').value,
        service_time: document.getElementById('service-time').value,
        description: document.getElementById('service-description').value
    };
    
    try {
        const url = id ? `${API_BASE}/services/${id}` : `${API_BASE}/services`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeServiceModal();
            loadServices();
        } else {
            alert('Error saving service');
        }
    } catch (error) {
        console.error('Error saving service:', error);
        alert('Error saving service');
    }
}

async function deleteService(id) {
    if (!confirm('Are you sure you want to delete this service? This will also delete all attendance records for this service.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/services/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadServices();
        } else {
            alert('Error deleting service');
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        alert('Error deleting service');
    }
}

// Attendance
async function loadAttendancePage() {
    try {
        // Load services for dropdown
        const servicesResponse = await fetch(`${API_BASE}/services`);
        const services = await servicesResponse.json();
        
        const select = document.getElementById('attendance-service-select');
        if (services.length === 0) {
            select.innerHTML = '<option value="">No services available</option>';
        } else {
            select.innerHTML = '<option value="">Select a service...</option>' +
                services.map(service => `
                    <option value="${service.id}">${formatDate(service.service_date)} - ${capitalizeFirst(service.service_type)} ${service.service_time || ''}</option>
                `).join('');
        }
        
        select.onchange = () => loadAttendanceChecklist(select.value);
    } catch (error) {
        console.error('Error loading attendance page:', error);
    }
}

async function loadAttendanceChecklist(serviceId) {
    if (!serviceId) {
        document.getElementById('attendance-checklist').innerHTML = '<p class="info-message">👆 Select a service above to mark attendance</p>';
        document.getElementById('attendance-summary').style.display = 'none';
        return;
    }
    
    try {
        // Load all believers
        const believersResponse = await fetch(`${API_BASE}/believers`);
        const believers = await believersResponse.json();
        
        // Load existing attendance for this service
        const attendanceResponse = await fetch(`${API_BASE}/attendance?service_id=${serviceId}`);
        const attendance = await attendanceResponse.json();
        const attendedIds = new Set(attendance.map(a => a.believer_id));
        
        const checklist = document.getElementById('attendance-checklist');
        if (believers.length === 0) {
            checklist.innerHTML = '<p class="info-message">No believers registered</p>';
            document.getElementById('attendance-summary').style.display = 'none';
        } else {
            checklist.innerHTML = '<h4 style="margin-bottom: 15px; color: #2c3e50;">2. Mark Attendance (Check = Present, Unchecked = Absent):</h4>' + 
                believers.map(believer => {
                const isChecked = attendedIds.has(believer.id);
                return `
                    <div class="attendance-item ${isChecked ? 'checked' : ''}" id="attendance-${believer.id}">
                        <input type="checkbox" 
                               id="check-${believer.id}" 
                               ${isChecked ? 'checked' : ''}
                               onchange="toggleAttendance(${serviceId}, ${believer.id}, this.checked)">
                        <label for="check-${believer.id}">${believer.first_name} ${believer.last_name}</label>
                    </div>
                `;
            }).join('');
            
            // Update summary
            updateAttendanceSummary(believers.length, attendedIds.size);
        }
    } catch (error) {
        console.error('Error loading attendance checklist:', error);
    }
}

function updateAttendanceSummary(total, present) {
    const absent = total - present;
    
    document.getElementById('attendance-present-count').textContent = present;
    document.getElementById('attendance-absent-count').textContent = absent;
    document.getElementById('attendance-total-count').textContent = total;
    document.getElementById('attendance-summary').style.display = 'block';
}

async function toggleAttendance(serviceId, believerId, isChecked) {
    try {
        if (isChecked) {
            // Add attendance
            const response = await fetch(`${API_BASE}/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    service_id: serviceId,
                    believer_id: believerId
                })
            });
            
            if (response.ok) {
                document.getElementById(`attendance-${believerId}`).classList.add('checked');
                updateSummaryCounts(1);
            } else {
                alert('Error recording attendance');
                document.getElementById(`check-${believerId}`).checked = false;
            }
        } else {
            // Remove attendance
            const attendanceResponse = await fetch(`${API_BASE}/attendance?service_id=${serviceId}&believer_id=${believerId}`);
            const attendance = await attendanceResponse.json();
            
            if (attendance.length > 0) {
                const response = await fetch(`${API_BASE}/attendance/${attendance[0].id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    document.getElementById(`attendance-${believerId}`).classList.remove('checked');
                    updateSummaryCounts(-1);
                } else {
                    alert('Error removing attendance');
                    document.getElementById(`check-${believerId}`).checked = true;
                }
            }
        }
    } catch (error) {
        console.error('Error toggling attendance:', error);
        alert('Error updating attendance');
    }
}

function updateSummaryCounts(change) {
    const presentEl = document.getElementById('attendance-present-count');
    const absentEl = document.getElementById('attendance-absent-count');
    
    let present = parseInt(presentEl.textContent) + change;
    let total = parseInt(document.getElementById('attendance-total-count').textContent);
    let absent = total - present;
    
    presentEl.textContent = present;
    absentEl.textContent = absent;
}

// Reports
async function loadReportsPage() {
    try {
        // Load believers for dropdown
        const believersResponse = await fetch(`${API_BASE}/believers`);
        const believers = await believersResponse.json();
        
        const believerSelect = document.getElementById('report-believer-select');
        believerSelect.innerHTML = '<option value="">Select a believer...</option>' +
            believers.map(b => `<option value="${b.id}">${b.first_name} ${b.last_name}</option>`).join('');
        
        // Load services for dropdown
        const servicesResponse = await fetch(`${API_BASE}/services`);
        const services = await servicesResponse.json();
        
        const serviceSelect = document.getElementById('report-service-select');
        serviceSelect.innerHTML = '<option value="">Select a service...</option>' +
            services.map(s => `<option value="${s.id}">${formatDate(s.service_date)} - ${capitalizeFirst(s.service_type)}</option>`).join('');
    } catch (error) {
        console.error('Error loading reports page:', error);
    }
}

async function loadBelieverReport() {
    const believerId = document.getElementById('report-believer-select').value;
    const content = document.getElementById('believer-report-content');
    
    if (!believerId) {
        content.innerHTML = '<p class="info-message">Select a believer to view their attendance report</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/believers/${believerId}`);
        const believer = await response.json();
        
        content.innerHTML = `
            <div class="report-stats">
                <div class="report-stat">
                    <div class="value">${believer.stats.total}</div>
                    <div class="label">Total Services</div>
                </div>
                <div class="report-stat">
                    <div class="value">${believer.stats.sunday}</div>
                    <div class="label">Sunday Services</div>
                </div>
                <div class="report-stat">
                    <div class="value">${believer.stats.midweek}</div>
                    <div class="label">Midweek Services</div>
                </div>
            </div>
            <p style="text-align: center; color: #7f8c8d; margin-top: 20px;">
                <strong>${believer.first_name} ${believer.last_name}</strong> has attended 
                ${believer.stats.total} service${believer.stats.total !== 1 ? 's' : ''} in total.
            </p>
        `;
    } catch (error) {
        console.error('Error loading believer report:', error);
        content.innerHTML = '<p class="info-message">Error loading report</p>';
    }
}

async function loadServiceReport() {
    const serviceId = document.getElementById('report-service-select').value;
    const content = document.getElementById('service-report-content');
    
    if (!serviceId) {
        content.innerHTML = '<p class="info-message">Select a service to view attendance details</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/services/${serviceId}`);
        const service = await response.json();
        
        let attendeesList = '';
        if (service.attendees.length === 0) {
            attendeesList = '<p class="info-message">No attendance recorded for this service</p>';
        } else {
            attendeesList = `
                <div class="attendee-list">
                    ${service.attendees.map(attendee => `
                        <div class="attendee-list-item">${attendee.name}</div>
                    `).join('')}
                </div>
            `;
        }
        
        content.innerHTML = `
            <div class="report-stats">
                <div class="report-stat">
                    <div class="value">${service.attendance_count}</div>
                    <div class="label">Total Attendees</div>
                </div>
            </div>
            <h4 style="margin-top: 20px; margin-bottom: 10px;">Attendees List:</h4>
            ${attendeesList}
        `;
    } catch (error) {
        console.error('Error loading service report:', error);
        content.innerHTML = '<p class="info-message">Error loading report</p>';
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

