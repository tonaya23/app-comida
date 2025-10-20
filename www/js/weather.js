// js/weather.js - Integración con API del Clima

const WEATHER_API_KEY = 'f12d9e1fb0f31b9e6e7f01eebea09991'; // Obtener gratis en openweathermap.org
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

class WeatherService {
    constructor() {
        this.cache = {
            data: null,
            timestamp: null,
            expiry: 15 * 60 * 1000 // 15 minutos
        };
    }

    // Obtener clima por coordenadas
    async getWeatherByCoords(lat, lon) {
        try {
            // Verificar cache
            if (this.isCacheValid()) {
                return this.cache.data;
            }

            const response = await fetch(
                `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`
            );
            
            if (!response.ok) {
                throw new Error('Error al obtener datos del clima');
            }
            
            const data = await response.json();
            
            // Guardar en cache
            this.cache.data = this.formatWeatherData(data);
            this.cache.timestamp = Date.now();
            
            return this.cache.data;
            
        } catch (error) {
            console.error('Error fetching weather:', error);
            return this.getDefaultWeather();
        }
    }

    // Obtener clima por ciudad
    async getWeatherByCity(city) {
        try {
            const response = await fetch(
                `${WEATHER_BASE_URL}/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric&lang=es`
            );
            
            if (!response.ok) {
                throw new Error('Ciudad no encontrada');
            }
            
            const data = await response.json();
            return this.formatWeatherData(data);
            
        } catch (error) {
            console.error('Error fetching weather by city:', error);
            return this.getDefaultWeather();
        }
    }

    // Formatear datos del clima
    formatWeatherData(data) {
        return {
            temperature: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            city: data.name,
            country: data.sys.country,
            windSpeed: data.wind.speed,
            visibility: data.visibility / 1000, // km
            isDaytime: this.isDaytime(data.sys.sunrise, data.sys.sunset)
        };
    }

    // Verificar si es de día
    isDaytime(sunrise, sunset) {
        const now = Math.floor(Date.now() / 1000);
        return now > sunrise && now < sunset;
    }

    // Verificar cache válido
    isCacheValid() {
        return this.cache.data && 
               this.cache.timestamp && 
               (Date.now() - this.cache.timestamp) < this.cache.expiry;
    }

    // Datos por defecto en caso de error
    getDefaultWeather() {
        return {
            temperature: 22,
            feelsLike: 24,
            humidity: 65,
            description: 'parcialmente nublado',
            icon: '02d',
            city: 'Tu ciudad',
            country: 'AR',
            windSpeed: 3.5,
            visibility: 10,
            isDaytime: true
        };
    }

    // Obtener icono del clima
    getWeatherIcon(iconCode) {
        const iconMap = {
            '01d': 'fas fa-sun',           // despejado día
            '01n': 'fas fa-moon',          // despejado noche
            '02d': 'fas fa-cloud-sun',     // pocas nubes día
            '02n': 'fas fa-cloud-moon',    // pocas nubes noche
            '03d': 'fas fa-cloud',         // nublado
            '03n': 'fas fa-cloud',
            '04d': 'fas fa-cloud',         // muy nublado
            '04n': 'fas fa-cloud',
            '09d': 'fas fa-cloud-rain',    // lluvia
            '09n': 'fas fa-cloud-rain',
            '10d': 'fas fa-cloud-sun-rain',// lluvia y sol
            '10n': 'fas fa-cloud-moon-rain',
            '11d': 'fas fa-bolt',          // tormenta
            '11n': 'fas fa-bolt',
            '13d': 'fas fa-snowflake',     // nieve
            '13n': 'fas fa-snowflake',
            '50d': 'fas fa-smog',          // niebla
            '50n': 'fas fa-smog'
        };
        
        return iconMap[iconCode] || 'fas fa-cloud';
    }

    // Obtener recomendación basada en el clima
    getWeatherRecommendation(weatherData) {
        const temp = weatherData.temperature;
        const description = weatherData.description.toLowerCase();
        
        if (temp > 30) {
            return {
                message: "¡Hace calor! Perfecto para una ensalada fresca o una bebida helada",
                products: ['ensalada', 'bebidas'],
                emoji: '🥗🥤'
            };
        } else if (temp < 15) {
            return {
                message: "¡Hace frío! Ideal para una pizza caliente o una hamburguesa reconfortante",
                products: ['pizza', 'hamburguesa'],
                emoji: '🍕🍔'
            };
        } else if (description.includes('lluvia') || description.includes('lluvioso')) {
            return {
                message: "¡Día lluvioso! Qué mejor que comida caliente a domicilio",
                products: ['pizza', 'hamburguesa', 'sopas'],
                emoji: '☔🍲'
            };
        } else {
            return {
                message: "¡Clima perfecto! Disfruta de nuestro menú completo",
                products: ['all'],
                emoji: '😊🍽️'
            };
        }
    }
}

// Instancia global del servicio de clima
const weatherService = new WeatherService();

// Función para obtener ubicación del usuario
async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalización no soportada'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => resolve({
                lat: position.coords.latitude,
                lon: position.coords.longitude
            }),
            error => reject(error),
            { timeout: 10000 }
        );
    });
}

// Inicializar widget del clima
async function initializeWeatherWidget() {
    try {
        const coords = await getUserLocation();
        const weatherData = await weatherService.getWeatherByCoords(coords.lat, coords.lon);
        
        updateWeatherWidget(weatherData);
        updateWeatherRecommendation(weatherData);
        
    } catch (error) {
        console.log('Usando clima por defecto:', error.message);
        const defaultWeather = weatherService.getDefaultWeather();
        updateWeatherWidget(defaultWeather);
    }
}

// Actualizar widget del clima en la UI
function updateWeatherWidget(weatherData) {
    const weatherWidget = document.getElementById('weather-widget');
    if (!weatherWidget) return;
    
    const iconClass = weatherService.getWeatherIcon(weatherData.icon);
    const recommendation = weatherService.getWeatherRecommendation(weatherData);
    
    weatherWidget.innerHTML = `
        <div class="weather-header">
            <i class="${iconClass} weather-icon"></i>
            <div class="weather-temp">${weatherData.temperature}°C</div>
        </div>
        <div class="weather-info">
            <div class="weather-city">${weatherData.city}</div>
            <div class="weather-desc">${weatherData.description}</div>
            <div class="weather-details">
                <span><i class="fas fa-wind"></i> ${weatherData.windSpeed} m/s</span>
                <span><i class="fas fa-tint"></i> ${weatherData.humidity}%</span>
            </div>
        </div>
    `;
}

// Actualizar recomendación basada en clima
function updateWeatherRecommendation(weatherData) {
    const recommendationElement = document.getElementById('weather-recommendation');
    if (!recommendationElement) return;
    
    const recommendation = weatherService.getWeatherRecommendation(weatherData);
    
    recommendationElement.innerHTML = `
        <div class="weather-recommendation">
            <div class="recommendation-emoji">${recommendation.emoji}</div>
            <div class="recommendation-text">${recommendation.message}</div>
        </div>
    `;
    
    // Resaltar productos recomendados en el menú
    highlightRecommendedProducts(recommendation.products);
}

// Resaltar productos recomendados
function highlightRecommendedProducts(recommendedProducts) {
    if (recommendedProducts.includes('all')) return;
    
    document.querySelectorAll('.card').forEach(card => {
        const productId = card.getAttribute('data-product');
        if (recommendedProducts.includes(productId)) {
            card.classList.add('recommended');
            card.innerHTML += '<div class="recommended-badge"><i class="fas fa-star"></i> Recomendado</div>';
        }
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si el usuario está autenticado
    if (getCurrentUser()) {
        setTimeout(initializeWeatherWidget, 1000);
    }
});