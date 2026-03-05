import { EventBus } from './EventBus.js';
import { Formatters } from '../utils/formatters.js';

/**
 * Map Controller - Handles all map operations
 */
export class MapController {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.map = null;
        this.markers = [];
        this.currentMarker = null;
        this.routingControl = null;
        this.layers = {};
        
        this.initialize();
    }

    /**
     * Initialize map
     */
    initialize() {
        this.map = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([40.7128, -74.0060], 13);

        this.initializeLayers();
        this.initializeRouting();
        this.setupEventListeners();
        
        // Set default layer
        this.setLayer('dark');
    }

    /**
     * Initialize map layers
     */
    initializeLayers() {
        // Dark theme (CartoDB Dark Matter)
        this.layers.dark = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            {
                maxZoom: 19,
                attribution: '©OpenStreetMap, ©CartoDB'
            }
        );

        // Light theme
        this.layers.light = L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }
        );

        // Satellite
        this.layers.satellite = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                maxZoom: 19,
                attribution: '© Esri'
            }
        );

        // Terrain
        this.layers.terrain = L.tileLayer(
            'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            {
                maxZoom: 17,
                attribution: '© OpenTopoMap'
            }
        );
    }

    /**
     * Initialize routing control
     */
    initializeRouting() {
        this.routingControl = L.Routing.control({
            waypoints: [],
            routeWhileDragging: true,
            show: false,
            addWaypoints: false,
            createMarker: () => null,
            lineOptions: {
                styles: [
                    {
                        color: '#6366f1',
                        opacity: 0.8,
                        weight: 5
                    }
                ]
            }
        }).addTo(this.map);
    }

    /**
     * Set active map layer
     */
    setLayer(layerName) {
        // Remove all layers
        Object.values(this.layers).forEach(layer => {
            if (this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            }
        });

        // Add selected layer
        if (this.layers[layerName]) {
            this.layers[layerName].addTo(this.map);
            this.eventBus.emit('layerChanged', layerName);
        }
    }

    /**
     * Setup map event listeners
     */
    setupEventListeners() {
        // Click to add marker
        this.map.on('click', (e) => {
            this.addMarker(e.latlng.lat, e.latlng.lng, 'Selected Location');
        });

        // Map move end
        this.map.on('moveend', () => {
            const center = this.map.getCenter();
            this.eventBus.emit('mapMoved', {
                lat: center.lat,
                lng: center.lng
            });
        });

        // Zoom end
        this.map.on('zoomend', () => {
            this.eventBus.emit('zoomChanged', this.map.getZoom());
        });
    }

    /**
     * Add marker to map
     */
    addMarker(lat, lng, title, address = null) {
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div class="marker-pin"></div>
                <i class="fas fa-map-marker-alt marker-icon"></i>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
        
        const popupContent = `
            <div class="popup-content">
                <div class="popup-header">${title}</div>
                <div class="popup-address">${address || Formatters.coordinates(lat, lng)}</div>
                <div class="popup-coords">${Formatters.coordinates(lat, lng, 6)}</div>
                <div class="popup-actions">
                    <button class="popup-btn primary" data-action="set-start" data-lat="${lat}" data-lng="${lng}" data-name="${title}">
                        <i class="fas fa-play"></i> Start
                    </button>
                    <button class="popup-btn secondary" data-action="set-end" data-lat="${lat}" data-lng="${lng}" data-name="${title}">
                        <i class="fas fa-stop"></i> End
                    </button>
                    <button class="popup-btn danger" data-action="remove-marker">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent, { 
            className: 'custom-popup',
            closeButton: false
        });

        // Handle popup button clicks
        marker.on('popupopen', () => {
            document.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    if (action === 'remove-marker') {
                        this.removeMarker(marker);
                    } else if (action === 'set-start') {
                        this.eventBus.emit('setStart', {
                            lat: parseFloat(e.currentTarget.dataset.lat),
                            lng: parseFloat(e.currentTarget.dataset.lng),
                            name: e.currentTarget.dataset.name
                        });
                    } else if (action === 'set-end') {
                        this.eventBus.emit('setEnd', {
                            lat: parseFloat(e.currentTarget.dataset.lat),
                            lng: parseFloat(e.currentTarget.dataset.lng),
                            name: e.currentTarget.dataset.name
                        });
                    }
                });
            });
        });
        
        this.markers.push(marker);
        this.currentMarker = marker;
        
        this.eventBus.emit('markerAdded', { lat, lng, title });
        
        return marker;
    }

    /**
     * Remove marker
     */
    removeMarker(marker) {
        if (marker) {
            this.map.removeLayer(marker);
            this.markers = this.markers.filter(m => m !== marker);
            if (this.currentMarker === marker) {
                this.currentMarker = null;
            }
            this.eventBus.emit('markerRemoved');
        }
    }

    /**
     * Clear all markers
     */
    clearMarkers() {
        this.markers.forEach(m => this.map.removeLayer(m));
        this.markers = [];
        this.currentMarker = null;
        this.eventBus.emit('markersCleared');
    }

    /**
     * Fly to location
     */
    flyTo(lat, lng, zoom = 16) {
        this.map.flyTo([lat, lng], zoom, {
            duration: 1.5,
            easeLinearity: 0.25
        });
    }

    /**
     * Set view
     */
    setView(lat, lng, zoom = 13) {
        this.map.setView([lat, lng], zoom);
    }

    /**
     * Reset view to default
     */
    resetView() {
        this.map.setView([40.7128, -74.0060], 13);
        this.eventBus.emit('viewReset');
    }

    /**
     * Zoom in
     */
    zoomIn() {
        this.map.zoomIn();
    }

    /**
     * Zoom out
     */
    zoomOut() {
        this.map.zoomOut();
    }

    /**
     * Calculate route
     */
    calculateRoute(start, end) {
        this.routingControl.setWaypoints([
            L.latLng(start.lat, start.lng),
            L.latLng(end.lat, end.lng)
        ]);

        return new Promise((resolve) => {
            this.routingControl.on('routesfound', (e) => {
                resolve(e.routes[0]);
            });
        });
    }

    /**
     * Clear route
     */
    clearRoute() {
        this.routingControl.setWaypoints([]);
    }

    /**
     * Get current center
     */
    getCenter() {
        return this.map.getCenter();
    }

    /**
     * Get current zoom
     */
    getZoom() {
        return this.map.getZoom();
    }

    /**
     * Check if map is initialized
     */
    isInitialized() {
        return this.map !== null;
    }
}