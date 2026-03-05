import { EventBus } from './EventBus.js';
import { Geocoder } from '../utils/geocode.js';
import { debounce } from '../utils/debounce.js';

/**
 * Search Service - Handles location search
 */
export class SearchService {
    constructor(eventBus, mapController) {
        this.eventBus = eventBus;
        this.mapController = mapController;
        this.searchInput = document.getElementById('searchBox');
        this.searchResults = document.getElementById('searchResults');
        this.clearButton = document.getElementById('clearSearch');
        
        this.initialize();
    }

    /**
     * Initialize search service
     */
    initialize() {
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Debounced search
        const debouncedSearch = debounce(this.performSearch.bind(this), 400);
        
        this.searchInput.addEventListener('input', (e) => {
            const value = e.target.value;
            this.clearButton.classList.toggle('visible', value.length > 0);
            
            if (value.length < 3) {
                this.hideResults();
                return;
            }
            
            debouncedSearch(value);
        });

        // Clear search
        this.clearButton.addEventListener('click', () => {
            this.clearSearch();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper')) {
                this.hideResults();
            }
        });

        // Keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideResults();
            } else if (e.key === 'ArrowDown') {
                this.navigateResults('down');
            } else if (e.key === 'ArrowUp') {
                this.navigateResults('up');
            } else if (e.key === 'Enter') {
                this.selectFirstResult();
            }
        });
    }

    /**
     * Perform search
     */
    async performSearch(query) {
        this.showLoading();
        
        try {
            const results = await Geocoder.search(query);
            
            if (results.length === 0) {
                this.showNoResults();
                return;
            }
            
            this.displayResults(results);
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Display search results
     */
    displayResults(results) {
        this.searchResults.innerHTML = results.map((place, index) => `
            <div class="result-item" data-index="${index}" data-lat="${place.lat}" data-lng="${place.lon}" data-name="${place.display_name.replace(/'/g, "\\'")}">
                <div class="result-icon"><i class="fas fa-map-marker-alt"></i></div>
                <div class="result-content">
                    <div class="result-title">${place.display_name.split(',')[0]}</div>
                    <div class="result-address">${place.display_name}</div>
                    <div class="result-coords">${parseFloat(place.lat).toFixed(4)}, ${parseFloat(place.lon).toFixed(4)}</div>
                </div>
            </div>
        `).join('');

        this.searchResults.classList.add('active');

        // Add click handlers
        this.searchResults.querySelectorAll('.result-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectResult(item);
            });
        });
    }

    /**
     * Select a result
     */
    selectResult(item) {
        const lat = parseFloat(item.dataset.lat);
        const lng = parseFloat(item.dataset.lng);
        const name = item.dataset.name;

        this.mapController.flyTo(lat, lng);
        this.mapController.clearMarkers();
        this.mapController.addMarker(lat, lng, name.split(',')[0], name);
        
        this.searchInput.value = name.split(',')[0];
        this.hideResults();
        
        this.eventBus.emit('locationSelected', { lat, lng, name });
    }

    /**
     * Navigate results with keyboard
     */
    navigateResults(direction) {
        const items = this.searchResults.querySelectorAll('.result-item');
        if (!items.length) return;

        const current = this.searchResults.querySelector('.result-item.hover');
        let index = -1;

        if (current) {
            current.classList.remove('hover');
            index = Array.from(items).indexOf(current);
        }

        if (direction === 'down') {
            index = index + 1 < items.length ? index + 1 : 0;
        } else if (direction === 'up') {
            index = index - 1 >= 0 ? index - 1 : items.length - 1;
        }

        items[index].classList.add('hover');
        items[index].scrollIntoView({ block: 'nearest' });
    }

    /**
     * Select first result
     */
    selectFirstResult() {
        const firstItem = this.searchResults.querySelector('.result-item');
        if (firstItem) {
            this.selectResult(firstItem);
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.searchResults.innerHTML = `
            <div class="result-item">
                <div class="result-content">
                    <div class="result-title">Searching...</div>
                </div>
            </div>
        `;
        this.searchResults.classList.add('active');
    }

    /**
     * Show no results
     */
    showNoResults() {
        this.searchResults.innerHTML = `
            <div class="result-item">
                <div class="result-content">
                    <div class="result-title">No results found</div>
                    <div class="result-address">Try a different search term</div>
                </div>
            </div>
        `;
        this.searchResults.classList.add('active');
    }

    /**
     * Show error
     */
    showError(message) {
        this.searchResults.innerHTML = `
            <div class="result-item">
                <div class="result-content">
                    <div class="result-title">Search failed</div>
                    <div class="result-address">${message}</div>
                </div>
            </div>
        `;
        this.searchResults.classList.add('active');
    }

    /**
     * Hide results
     */
    hideResults() {
        this.searchResults.classList.remove('active');
    }

    /**
     * Clear search
     */
    clearSearch() {
        this.searchInput.value = '';
        this.clearButton.classList.remove('visible');
        this.hideResults();
        this.mapController.clearMarkers();
        this.eventBus.emit('searchCleared');
    }
}