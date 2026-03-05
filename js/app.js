// app-fixed.js - Single file solution that works

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// App State
const state = {
    map: null,
    markers: [],
    currentMarker: null,
    routingControl: null,
    directionsSheet: null,
    searchResults: null,
    currentMode: 'driving',
    startPoint: null,
    endPoint: null
};

// Initialize App
function initApp() {
    console.log('Initializing GeoMap Pro...');
    
    // Simulate loading
    simulateLoading();
    
    // Initialize map
    initMap();
    
    // Setup event listeners
    setupEventListeners();
    
    // Fetch initial weather
    setTimeout(() => {
        fetchWeather(40.7128, -74.0060, 'New York');
    }, 1000);
}

// Simulate loading
function simulateLoading() {
    const loader = document.getElementById('loader');
    const progress = document.getElementById('loaderProgress');
    let width = 0;
    
    const interval = setInterval(() => {
        width += Math.random() * 15;
        if (width > 100) width = 100;
        progress.style.width = width + '%';
        
        if (width === 100) {
            clearInterval(interval);
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 400);
        }
    }, 150);
}

// Initialize Map
function initMap() {
    // Create map
    state.map = L.map('map', {
        zoomControl: false,
        attributionControl: true
    }).setView([40.7128, -74.0060], 13);
    
    // Add dark theme tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(state.map);
    
    // Initialize routing control
    state.routingControl = L.Routing.control({
        waypoints: [],
        routeWhileDragging: true,
        show: false,
        addWaypoints: false,
        lineOptions: {
            styles: [{ color: '#6366f1', opacity: 0.8, weight: 5 }]
        },
        createMarker: function() { return null; }
    }).addTo(state.map);
    
    // Hide routing container
    state.routingControl.on('routesfound', function(e) {
        displayRouteResults(e.routes[0]);
    });
    
    // Map click handler
    state.map.on('click', function(e) {
        addMarker(e.latlng.lat, e.latlng.lng, 'Selected Location');
    });
    
    // Map move handler for weather
    state.map.on('moveend', function() {
        const center = state.map.getCenter();
        fetchWeather(center.lat, center.lng);
    });
    
    console.log('Map initialized');
}

// Setup Event Listeners
function setupEventListeners() {
    // Brand toggle
    document.getElementById('brandToggle').addEventListener('click', toggleSidebar);
    
    // Search
    const searchBox = document.getElementById('searchBox');
    const clearSearch = document.getElementById('clearSearch');
    
    searchBox.addEventListener('input', function(e) {
        const value = e.target.value;
        clearSearch.classList.toggle('visible', value.length > 0);
        
        if (value.length < 3) {
            hideSearchResults();
            return;
        }
        
        debounce(performSearch, 400)(value);
    });
    
    clearSearch.addEventListener('click', function() {
        searchBox.value = '';
        clearSearch.classList.remove('visible');
        hideSearchResults();
        clearMarkers();
    });
    
    // Close search on outside click
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-wrapper')) {
            hideSearchResults();
        }
    });
    
    // Directions
    const directionsBtn = document.getElementById('directionsBtn');
    const closeDirectionsBtn = document.getElementById('closeDirectionsBtn');
    const swapBtn = document.getElementById('swapBtn');
    const calculateBtn = document.getElementById('calculateRouteBtn');
    
    directionsBtn.addEventListener('click', toggleDirections);
    closeDirectionsBtn.addEventListener('click', toggleDirections);
    swapBtn.addEventListener('click', swapDirections);
    calculateBtn.addEventListener('click', calculateRoute);
    
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.currentMode = this.dataset.mode;
        });
    });
    
    // Navigation
    document.querySelectorAll('[data-nav]').forEach(item => {
        item.addEventListener('click', function() {
            const action = this.dataset.nav;
            document.querySelectorAll('[data-nav]').forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            handleNavigation(action);
        });
    });
    
    // FAB buttons
    document.getElementById('zoomInBtn').addEventListener('click', function() {
        state.map.zoomIn();
    });
    
    document.getElementById('zoomOutBtn').addEventListener('click', function() {
        state.map.zoomOut();
    });
    
    document.getElementById('resetViewBtn').addEventListener('click', function() {
        state.map.setView([40.7128, -74.0060], 13);
        showToast('View reset', 'success');
    });
    
    // Locate button
    document.getElementById('locateBtn').addEventListener('click', locateUser);
    
    // Notifications
    document.getElementById('notificationsBtn').addEventListener('click', function() {
        showToast('Notifications coming soon!', 'success');
    });
    
    // Profile
    document.getElementById('profileBtn').addEventListener('click', function() {
        showToast('Profile feature coming soon!', 'success');
    });
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Toggle Sidebar
function toggleSidebar() {
    document.getElementById('app').classList.toggle('sidebar-expanded');
}

// Handle Navigation
function handleNavigation(action) {
    const messages = {
        'explore': 'Explore mode activated',
        'traffic': 'Traffic layer enabled',
        'transit': 'Transit information coming soon',
        'cycling': 'Cycling routes coming soon',
        'satellite': 'Satellite view enabled',
        'terrain': 'Terrain view enabled',
        'settings': 'Settings coming soon'
    };
    
    showToast(messages[action] || `${action} activated`, 'success');
}

// Search
async function performSearch(query) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '<div class="result-item"><div class="result-content">Searching...</div></div>';
    container.classList.add('active');
    
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        
        if (data.length === 0) {
            container.innerHTML = '<div class="result-item"><div class="result-content">No results found</div></div>';
            return;
        }
        
        container.innerHTML = data.map(place => `
            <div class="result-item" onclick="selectLocation(${place.lat}, ${place.lon}, '${place.display_name.replace(/'/g, "\\'")}')">
                <div class="result-icon"><i class="fas fa-map-marker-alt"></i></div>
                <div class="result-content">
                    <div class="result-title">${place.display_name.split(',')[0]}</div>
                    <div class="result-address">${place.display_name.substring(0, 60)}...</div>
                    <div class="result-coords">${parseFloat(place.lat).toFixed(4)}, ${parseFloat(place.lon).toFixed(4)}</div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = '<div class="result-item"><div class="result-content">Search failed</div></div>';
    }
}

// Make selectLocation global
window.selectLocation = function(lat, lng, name) {
    state.map.flyTo([lat, lng], 16);
    clearMarkers();
    addMarker(lat, lng, name.split(',')[0], name);
    document.getElementById('searchBox').value = name.split(',')[0];
    hideSearchResults();
    fetchWeather(lat, lng, name.split(',')[0]);
    showToast(`Found: ${name.split(',')[0]}`, 'success');
};

function hideSearchResults() {
    document.getElementById('searchResults').classList.remove('active');
}

// Marker functions
function addMarker(lat, lng, title, address = null) {
    const marker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-marker',
            html: `
                <div class="marker-pin"></div>
                <i class="fas fa-map-marker-alt marker-icon"></i>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        })
    }).addTo(state.map);
    
    const popupContent = `
        <div class="popup-content">
            <div class="popup-header">${title}</div>
            <div class="popup-address">${address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}</div>
            <div class="popup-coords">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
            <div class="popup-actions">
                <button class="popup-btn primary" onclick="setAsStart(${lat}, ${lng}, '${title.replace(/'/g, "\\'")}')">
                    <i class="fas fa-play"></i> Start
                </button>
                <button class="popup-btn secondary" onclick="setAsEnd(${lat}, ${lng}, '${title.replace(/'/g, "\\'")}')">
                    <i class="fas fa-stop"></i> End
                </button>
                <button class="popup-btn danger" onclick="removeMarker(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    marker.bindPopup(popupContent, { className: 'custom-popup' });
    marker.openPopup();
    
    state.markers.push(marker);
    state.currentMarker = marker;
    
    return marker;
}

// Make marker functions global
window.setAsStart = function(lat, lng, name) {
    document.getElementById('startPoint').value = name;
    document.getElementById('startPoint').dataset.lat = lat;
    document.getElementById('startPoint').dataset.lng = lng;
    state.startPoint = { lat, lng, name };
    
    if (!document.getElementById('directionsSheet').classList.contains('active')) {
        toggleDirections();
    }
    
    showToast('Set as starting point', 'success');
};

window.setAsEnd = function(lat, lng, name) {
    document.getElementById('endPoint').value = name;
    document.getElementById('endPoint').dataset.lat = lat;
    document.getElementById('endPoint').dataset.lng = lng;
    state.endPoint = { lat, lng, name };
    
    if (!document.getElementById('directionsSheet').classList.contains('active')) {
        toggleDirections();
    }
    
    showToast('Set as destination', 'success');
};

window.removeMarker = function(btn) {
    if (state.currentMarker) {
        state.map.removeLayer(state.currentMarker);
        state.markers = state.markers.filter(m => m !== state.currentMarker);
        state.currentMarker = null;
    }
};

function clearMarkers() {
    state.markers.forEach(m => state.map.removeLayer(m));
    state.markers = [];
    state.currentMarker = null;
}

// Directions functions
function toggleDirections() {
    const sheet = document.getElementById('directionsSheet');
    const btn = document.getElementById('directionsBtn');
    
    sheet.classList.toggle('active');
    btn.classList.toggle('active');
    
    if (!sheet.classList.contains('active')) {
        state.routingControl.setWaypoints([]);
        document.getElementById('routeResults').style.display = 'none';
    }
}

function swapDirections() {
    const start = document.getElementById('startPoint');
    const end = document.getElementById('endPoint');
    
    [start.value, end.value] = [end.value, start.value];
    [start.dataset.lat, end.dataset.lat] = [end.dataset.lat, start.dataset.lat];
    [start.dataset.lng, end.dataset.lng] = [end.dataset.lng, start.dataset.lng];
    
    [state.startPoint, state.endPoint] = [state.endPoint, state.startPoint];
}

async function calculateRoute() {
    const start = document.getElementById('startPoint');
    const end = document.getElementById('endPoint');
    
    let startLat = start.dataset.lat;
    let startLng = start.dataset.lng;
    let endLat = end.dataset.lat;
    let endLng = end.dataset.lng;
    
    // Geocode if needed
    if (!startLat && start.value) {
        const coords = await geocode(start.value);
        if (!coords) return showToast('Could not find start location', 'error');
        startLat = coords.lat;
        startLng = coords.lng;
    }
    
    if (!endLat && end.value) {
        const coords = await geocode(end.value);
        if (!coords) return showToast('Could not find destination', 'error');
        endLat = coords.lat;
        endLng = coords.lng;
    }
    
    if (!startLat || !endLat) {
        return showToast('Please enter both locations', 'error');
    }
    
    state.routingControl.setWaypoints([
        L.latLng(parseFloat(startLat), parseFloat(startLng)),
        L.latLng(parseFloat(endLat), parseFloat(endLng))
    ]);
    
    showToast('Calculating route...', 'success');
}

async function geocode(query) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await res.json();
        return data.length ? { lat: data[0].lat, lng: data[0].lon } : null;
    } catch (e) {
        return null;
    }
}

function displayRouteResults(route) {
    const container = document.getElementById('routeResults');
    const distance = (route.summary.totalDistance / 1000).toFixed(1);
    const time = Math.round(route.summary.totalTime / 60);
    
    container.innerHTML = `
        <div class="route-summary animate-slide-up">
            <div class="route-header">
                <div>
                    <div class="route-time">${formatTime(time)}</div>
                    <div class="route-distance">${distance} km</div>
                </div>
                <div class="route-badge">Fastest</div>
            </div>
            <div class="steps-list">
                ${route.instructions.slice(0, 5).map((step, i) => `
                    <div class="step">
                        <div class="step-icon"><i class="fas ${getStepIcon(step.type)}"></i></div>
                        <div class="step-content">
                            <div class="step-instruction">${step.text}</div>
                            ${step.distance > 0 ? `<div class="step-distance">${(step.distance / 1000).toFixed(1)} km</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    container.style.display = 'block';
}

function formatTime(minutes) {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getStepIcon(type) {
    const icons = {
        'Straight': 'fa-arrow-up',
        'Right': 'fa-arrow-right',
        'Left': 'fa-arrow-left',
        'SharpRight': 'fa-arrow-right',
        'SharpLeft': 'fa-arrow-left',
        'TurnAround': 'fa-undo',
        'DestinationReached': 'fa-flag-checkered'
    };
    return icons[type] || 'fa-arrow-up';
}

// Weather functions
async function fetchWeather(lat, lng, locationName) {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
        const data = await res.json();
        
        if (data.current_weather) {
            updateWeatherUI(data.current_weather, locationName);
        }
    } catch (e) {
        console.error('Weather error:', e);
    }
}

function updateWeatherUI(weather, location) {
    const temp = Math.round(weather.temperature);
    const code = weather.weathercode;
    
    const conditions = {
        0: { text: 'Clear Sky', icon: 'fa-sun', color: '#f59e0b' },
        1: { text: 'Partly Cloudy', icon: 'fa-cloud-sun', color: '#f59e0b' },
        2: { text: 'Cloudy', icon: 'fa-cloud', color: '#9ca3af' },
        3: { text: 'Overcast', icon: 'fa-cloud', color: '#6b7280' },
        61: { text: 'Rain', icon: 'fa-cloud-rain', color: '#3b82f6' },
        71: { text: 'Snow', icon: 'fa-snowflake', color: '#06b6d4' }
    };
    
    const cond = conditions[code] || conditions[0];
    
    document.getElementById('weatherTemp').textContent = `${temp}°`;
    document.getElementById('weatherCondition').textContent = cond.text;
    document.getElementById('weatherLocation').textContent = location || 'Current Location';
    
    const icon = document.getElementById('weatherIcon');
    icon.className = `fas ${cond.icon} weather-icon-large`;
    icon.style.color = cond.color;
}

// User location
function locateUser() {
    showToast('Locating...', 'success');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(pos) {
                const { latitude, longitude } = pos.coords;
                state.map.flyTo([latitude, longitude], 16);
                clearMarkers();
                addMarker(latitude, longitude, 'Your Location');
                showToast('Location found!', 'success');
            },
            function() {
                showToast('Location access denied', 'error');
            }
        );
    } else {
        showToast('Geolocation not supported', 'error');
    }
}

// Toast notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${type === 'success' ? 'fa-check' : 'fa-exclamation'}"></i></div>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}