import { EventBus } from './EventBus.js';

/**
 * UI Manager - Handles UI interactions and components
 */
export class UIManager {
    constructor(eventBus, mapController) {
        this.eventBus = eventBus;
        this.mapController = mapController;
        
        this.app = document.getElementById('app');
        this.loader = document.getElementById('loader');
        this.loaderProgress = document.getElementById('loaderProgress');
        this.toastContainer = document.getElementById('toastContainer');
        
        this.initialize();
    }

    /**
     * Initialize UI Manager
     */
    initialize() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupFABs();
        this.simulateLoading();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Brand toggle
        document.getElementById('brandToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Locate button
        document.getElementById('locateBtn').addEventListener('click', () => {
            this.locateUser();
        });

        // Notifications
        document.getElementById('notificationsBtn').addEventListener('click', () => {
            this.showToast('Notifications coming soon!', 'success');
        });

        // Profile
        document.getElementById('profileBtn').addEventListener('click', () => {
            this.showToast('Profile feature coming soon!', 'success');
        });

        // Zoom controls
        document.getElementById('zoomInBtn').addEventListener('click', () => {
            this.mapController.zoomIn();
        });

        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            this.mapController.zoomOut();
        });

        document.getElementById('resetViewBtn').addEventListener('click', () => {
            this.mapController.resetView();
        });

        // Toast events
        this.eventBus.on('toast', (data) => {
            this.showToast(data.message, data.type);
        });
    }

    /**
     * Setup navigation
     */
    setupNavigation() {
        document.querySelectorAll('[data-nav]').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.nav;
                
                // Update active state
                document.querySelectorAll('[data-nav]').forEach(el => {
                    el.classList.remove('active');
                });
                e.currentTarget.classList.add('active');
                
                // Handle navigation
                this.handleNavigation(action);
            });
        });
    }

    /**
     * Setup FABs
     */
    setupFABs() {
        // Additional FAB functionality if needed
    }

    /**
     * Handle navigation
     */
    handleNavigation(action) {
        switch(action) {
            case 'satellite':
                this.mapController.setLayer('satellite');
                this.showToast('Satellite view enabled', 'success');
                break;
                
            case 'terrain':
                this.mapController.setLayer('terrain');
                this.showToast('Terrain view enabled', 'success');
                break;
                
            case 'explore':
                this.mapController.setLayer('dark');
                this.showToast('Explore mode activated', 'success');
                break;
                
            case 'traffic':
                this.showToast('Traffic layer enabled', 'success');
                break;
                
            case 'transit':
                this.showToast('Transit information coming soon', 'success');
                break;
                
            case 'cycling':
                this.showToast('Cycling routes coming soon', 'success');
                break;
                
            case 'settings':
                this.showToast('Settings coming soon', 'success');
                break;
        }
    }

    /**
     * Toggle sidebar
     */
    toggleSidebar() {
        this.app.classList.toggle('sidebar-expanded');
    }

    /**
     * Locate user
     */
    locateUser() {
        this.showToast('Locating...', 'success');
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    this.mapController.flyTo(latitude, longitude);
                    this.mapController.clearMarkers();
                    this.mapController.addMarker(latitude, longitude, 'Your Location');
                    this.showToast('Location found!', 'success');
                },
                () => {
                    this.showToast('Location access denied', 'error');
                }
            );
        } else {
            this.showToast('Geolocation not supported', 'error');
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${type === 'success' ? 'fa-check' : 'fa-exclamation'}"></i></div>
            <span>${message}</span>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => toast.classList.add('show'));
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Simulate loading
     */
    simulateLoading() {
        let width = 0;
        const interval = setInterval(() => {
            width += Math.random() * 15;
            if (width > 100) width = 100;
            this.loaderProgress.style.width = width + '%';
            
            if (width === 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.loader.classList.add('hidden');
                }, 400);
            }
        }, 150);
    }

    /**
     * Show loading
     */
    showLoading() {
        this.loader.classList.remove('hidden');
        this.loaderProgress.style.width = '0%';
        this.simulateLoading();
    }

    /**
     * Hide loading
     */
    hideLoading() {
        this.loader.classList.add('hidden');
    }
}