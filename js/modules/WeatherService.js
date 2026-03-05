import { EventBus } from './EventBus.js';
import { Formatters } from '../utils/formatters.js';
import { throttle } from '../utils/debounce.js';

/**
 * Weather Service - Handles weather data
 */
export class WeatherService {
    constructor(eventBus, mapController) {
        this.eventBus = eventBus;
        this.mapController = mapController;
        
        this.locationEl = document.getElementById('weatherLocation');
        this.tempEl = document.getElementById('weatherTemp');
        this.conditionEl = document.getElementById('weatherCondition');
        this.metaEl = document.getElementById('weatherMeta');
        this.iconEl = document.getElementById('weatherIcon');
        this.updateEl = document.getElementById('weatherUpdate');
        
        this.cache = new Map();
        this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
        
        this.initialize();
    }

    /**
     * Initialize weather service
     */
    initialize() {
        // Throttled weather updates
        const throttledUpdate = throttle(this.fetchWeather.bind(this), 5000);
        
        this.eventBus.on('mapMoved', (center) => {
            throttledUpdate(center.lat, center.lng);
        });

        this.eventBus.on('locationSelected', (data) => {
            this.fetchWeather(data.lat, data.lng, data.name);
        });
    }

    /**
     * Fetch weather data
     */
    async fetchWeather(lat, lng, locationName = null) {
        // Check cache
        const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            this.updateUI(cached.data, locationName);
            return;
        }

        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
            );
            
            const data = await response.json();
            
            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            this.updateUI(data, locationName);
        } catch (error) {
            console.error('Weather fetch error:', error);
        }
    }

    /**
     * Update weather UI
     */
    updateUI(data, locationName) {
        if (!data.current_weather) return;

        const weather = data.current_weather;
        const temp = Math.round(weather.temperature);
        const condition = Formatters.weatherCondition(weather.weathercode);
        
        // Update location
        if (locationName) {
            this.locationEl.textContent = locationName;
        }
        
        // Update temperature
        this.tempEl.textContent = `${temp}°`;
        
        // Update condition
        this.conditionEl.textContent = condition.text;
        
        // Update icon
        this.iconEl.className = `fas ${condition.icon} weather-icon-large`;
        
        // Update meta (high/low)
        if (data.daily) {
            const high = Math.round(data.daily.temperature_2m_max[0]);
            const low = Math.round(data.daily.temperature_2m_min[0]);
            this.metaEl.textContent = `H: ${high}° L: ${low}°`;
        }
        
        // Update timestamp
        this.updateEl.textContent = 'Updated now';
        
        // Update icon color based on condition
        const colors = {
            'fa-sun': '#f59e0b',
            'fa-cloud-sun': '#f59e0b',
            'fa-cloud': '#9ca3af',
            'fa-smog': '#9ca3af',
            'fa-cloud-rain': '#3b82f6',
            'fa-snowflake': '#06b6d4',
            'fa-cloud-bolt': '#8b5cf6'
        };
        
        this.iconEl.style.color = colors[condition.icon] || '#f59e0b';
        this.iconEl.style.filter = `drop-shadow(0 4px 12px ${colors[condition.icon]}40)`;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}