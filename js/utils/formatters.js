/**
 * Format utilities for consistent data formatting
 */
export const Formatters = {
    /**
     * Format coordinates
     */
    coordinates(lat, lng, precision = 6) {
        return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
    },

    /**
     * Format distance
     */
    distance(meters, unit = 'metric') {
        if (meters < 1000) {
            return `${Math.round(meters)} m`;
        }
        const km = (meters / 1000).toFixed(1);
        return `${km} km`;
    },

    /**
     * Format duration
     */
    duration(minutes) {
        if (minutes < 60) {
            return `${Math.round(minutes)} min`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    },

    /**
     * Format time
     */
    time(date = new Date()) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Format date
     */
    date(date = new Date()) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },

    /**
     * Format temperature
     */
    temperature(celsius, unit = 'C') {
        if (unit === 'F') {
            const fahrenheit = (celsius * 9/5) + 32;
            return `${Math.round(fahrenheit)}°F`;
        }
        return `${Math.round(celsius)}°C`;
    },

    /**
     * Format address from Nominatim result
     */
    address(result) {
        if (!result) return '';
        
        const parts = [];
        if (result.address) {
            const addr = result.address;
            if (addr.road) parts.push(addr.road);
            if (addr.city || addr.town || addr.village) {
                parts.push(addr.city || addr.town || addr.village);
            }
            if (addr.country) parts.push(addr.country);
        }
        
        return parts.join(', ') || result.display_name || '';
    },

    /**
     * Format weather condition
     */
    weatherCondition(code) {
        const conditions = {
            0: { text: 'Clear Sky', icon: 'fa-sun' },
            1: { text: 'Partly Cloudy', icon: 'fa-cloud-sun' },
            2: { text: 'Cloudy', icon: 'fa-cloud' },
            3: { text: 'Overcast', icon: 'fa-cloud' },
            45: { text: 'Foggy', icon: 'fa-smog' },
            48: { text: 'Foggy', icon: 'fa-smog' },
            51: { text: 'Light Drizzle', icon: 'fa-cloud-rain' },
            61: { text: 'Rain', icon: 'fa-cloud-rain' },
            71: { text: 'Snow', icon: 'fa-snowflake' },
            95: { text: 'Thunderstorm', icon: 'fa-cloud-bolt' }
        };
        
        return conditions[code] || conditions[0];
    }
};