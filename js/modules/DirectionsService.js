import { EventBus } from './EventBus.js';
import { Geocoder } from '../utils/geocode.js';
import { Formatters } from '../utils/formatters.js';

/**
 * Directions Service - Handles route calculation and display
 */
export class DirectionsService {
    constructor(eventBus, mapController) {
        this.eventBus = eventBus;
        this.mapController = mapController;
        
        this.sheet = document.getElementById('directionsSheet');
        this.directionsBtn = document.getElementById('directionsBtn');
        this.closeBtn = document.getElementById('closeDirectionsBtn');
        this.startInput = document.getElementById('startPoint');
        this.endInput = document.getElementById('endPoint');
        this.swapBtn = document.getElementById('swapBtn');
        this.calculateBtn = document.getElementById('calculateRouteBtn');
        this.routeResults = document.getElementById('routeResults');
        
        this.currentMode = 'driving';
        this.start = null;
        this.end = null;
        
        this.initialize();
    }

    /**
     * Initialize directions service
     */
    initialize() {
        this.setupEventListeners();
        this.setupModeButtons();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle directions sheet
        this.directionsBtn.addEventListener('click', () => this.toggle());
        this.closeBtn.addEventListener('click', () => this.hide());

        // Swap start and end
        this.swapBtn.addEventListener('click', () => this.swap());

        // Calculate route
        this.calculateBtn.addEventListener('click', () => this.calculate());

        // Input events for geocoding
        this.startInput.addEventListener('blur', () => this.geocodeInput(this.startInput, 'start'));
        this.endInput.addEventListener('blur', () => this.geocodeInput(this.endInput, 'end'));

        // Event bus listeners
        this.eventBus.on('setStart', (data) => {
            this.setStart(data);
        });

        this.eventBus.on('setEnd', (data) => {
            this.setEnd(data);
        });
    }

    /**
     * Setup mode buttons
     */
    setupModeButtons() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMode = btn.dataset.mode;
                
                if (this.start && this.end) {
                    this.calculate();
                }
            });
        });
    }

    /**
     * Toggle directions sheet
     */
    toggle() {
        this.sheet.classList.toggle('active');
        this.directionsBtn.classList.toggle('active');
        
        if (!this.sheet.classList.contains('active')) {
            this.clear();
        }
    }

    /**
     * Show directions sheet
     */
    show() {
        this.sheet.classList.add('active');
        this.directionsBtn.classList.add('active');
    }

    /**
     * Hide directions sheet
     */
    hide() {
        this.sheet.classList.remove('active');
        this.directionsBtn.classList.remove('active');
        this.clear();
    }

    /**
     * Set start point
     */
    setStart(data) {
        this.start = data;
        this.startInput.value = data.name;
        this.startInput.dataset.lat = data.lat;
        this.startInput.dataset.lng = data.lng;
        this.show();
        this.eventBus.emit('toast', {
            message: 'Set as starting point',
            type: 'success'
        });
    }

    /**
     * Set end point
     */
    setEnd(data) {
        this.end = data;
        this.endInput.value = data.name;
        this.endInput.dataset.lat = data.lat;
        this.endInput.dataset.lng = data.lng;
        this.show();
        this.eventBus.emit('toast', {
            message: 'Set as destination',
            type: 'success'
        });
    }

    /**
     * Swap start and end
     */
    swap() {
        [this.start, this.end] = [this.end, this.start];
        
        // Swap input values
        [this.startInput.value, this.endInput.value] = [this.endInput.value, this.startInput.value];
        [this.startInput.dataset.lat, this.endInput.dataset.lat] = [this.endInput.dataset.lat, this.startInput.dataset.lat];
        [this.startInput.dataset.lng, this.endInput.dataset.lng] = [this.endInput.dataset.lng, this.startInput.dataset.lng];
        
        if (this.start && this.end) {
            this.calculate();
        }
    }

    /**
     * Geocode input
     */
    async geocodeInput(input, type) {
        const value = input.value.trim();
        if (!value) return;

        // Check if already geocoded
        if (input.dataset.lat && input.dataset.lng) {
            return;
        }

        try {
            const result = await Geocoder.geocodeSingle(value);
            if (result) {
                input.dataset.lat = result.lat;
                input.dataset.lng = result.lng;
                
                if (type === 'start') {
                    this.start = result;
                } else {
                    this.end = result;
                }
            } else {
                this.eventBus.emit('toast', {
                    message: `Could not find location: ${value}`,
                    type: 'error'
                });
            }
        } catch (error) {
            this.eventBus.emit('toast', {
                message: 'Geocoding failed',
                type: 'error'
            });
        }
    }

    /**
     * Calculate route
     */
    async calculate() {
        // Geocode if needed
        await this.geocodeInput(this.startInput, 'start');
        await this.geocodeInput(this.endInput, 'end');

        if (!this.startInput.dataset.lat || !this.endInput.dataset.lat) {
            this.eventBus.emit('toast', {
                message: 'Please enter valid locations',
                type: 'error'
            });
            return;
        }

        this.eventBus.emit('toast', {
            message: 'Calculating route...',
            type: 'success'
        });

        const start = {
            lat: parseFloat(this.startInput.dataset.lat),
            lng: parseFloat(this.startInput.dataset.lng)
        };

        const end = {
            lat: parseFloat(this.endInput.dataset.lat),
            lng: parseFloat(this.endInput.dataset.lng)
        };

        try {
            const route = await this.mapController.calculateRoute(start, end);
            this.displayRoute(route);
        } catch (error) {
            this.eventBus.emit('toast', {
                message: 'Failed to calculate route',
                type: 'error'
            });
        }
    }

    /**
     * Display route
     */
    displayRoute(route) {
        const distance = Formatters.distance(route.summary.totalDistance);
        const duration = Formatters.duration(route.summary.totalTime / 60);
        
        this.routeResults.innerHTML = `
            <div class="route-summary animate-slide-up">
                <div class="route-header">
                    <div>
                        <div class="route-time">${duration}</div>
                        <div class="route-distance">${distance}</div>
                    </div>
                    <div class="route-badge">Fastest</div>
                </div>
                <div class="steps-list">
                    ${route.instructions.slice(0, 5).map((step, i) => `
                        <div class="step animate-slide-up" style="animation-delay: ${i * 0.1}s">
                            <div class="step-icon"><i class="fas ${this.getStepIcon(step.type)}"></i></div>
                            <div class="step-content">
                                <div class="step-instruction">${step.text}</div>
                                ${step.distance > 0 ? `<div class="step-distance">${Formatters.distance(step.distance)}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.routeResults.style.display = 'block';
    }

    /**
     * Get step icon
     */
    getStepIcon(type) {
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

    /**
     * Clear directions
     */
    clear() {
        this.start = null;
        this.end = null;
        this.startInput.value = '';
        this.endInput.value = '';
        delete this.startInput.dataset.lat;
        delete this.startInput.dataset.lng;
        delete this.endInput.dataset.lat;
        delete this.endInput.dataset.lng;
        this.routeResults.style.display = 'none';
        this.mapController.clearRoute();
    }
}