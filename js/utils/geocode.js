/**
 * Geocoding service using Nominatim
 */
export class Geocoder {
    static async search(query, limit = 5) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}`
            );
            return await response.json();
        } catch (error) {
            console.error('Geocoding error:', error);
            throw new Error('Failed to geocode location');
        }
    }

    static async reverse(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            return await response.json();
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            throw new Error('Failed to reverse geocode');
        }
    }

    static async geocodeSingle(query) {
        const results = await this.search(query, 1);
        return results.length ? {
            lat: parseFloat(results[0].lat),
            lng: parseFloat(results[0].lon),
            name: results[0].display_name
        } : null;
    }
}