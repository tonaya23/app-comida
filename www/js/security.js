// js/security.js - Medidas de seguridad mejoradas

// Validación de email mejorada
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

// Validación de contraseña segura
function isStrongPassword(password) {
    if (password.length < 8) return false;
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
}

// Sanitización de entrada de texto
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
        .trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&#34;')
        .substring(0, 500); // Limitar longitud
}

// Validación de datos del pedido
function validateOrderData(orderData) {
    const errors = [];
    
    if (!orderData.address || orderData.address.trim().length < 10) {
        errors.push('La dirección debe tener al menos 10 caracteres');
    }
    
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        errors.push('El pedido debe contener al menos un producto');
    }
    
    if (orderData.total <= 0) {
        errors.push('El total del pedido debe ser mayor a 0');
    }
    
    // Validar cada item del pedido
    orderData.items.forEach((item, index) => {
        if (!item.id || !item.name || !item.price || !item.quantity) {
            errors.push(`El item ${index + 1} está incompleto`);
        }
        
        if (item.quantity <= 0 || item.quantity > 10) {
            errors.push(`La cantidad del item ${item.name} debe estar entre 1 y 10`);
        }
        
        if (item.price < 0) {
            errors.push(`El precio del item ${item.name} no puede ser negativo`);
        }
    });
    
    return errors;
}

// Rate limiting para prevenir ataques de fuerza bruta
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

function checkLoginAttempts(email) {
    const attempt = loginAttempts.get(email);
    
    if (attempt) {
        if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
            if (Date.now() - attempt.lastAttempt < LOCKOUT_TIME) {
                return {
                    allowed: false,
                    message: 'Demasiados intentos fallidos. Por favor, espera 15 minutos.'
                };
            } else {
                // Resetear contador después del tiempo de bloqueo
                loginAttempts.delete(email);
            }
        }
    }
    
    return { allowed: true };
}

function recordLoginAttempt(email, success) {
    if (!loginAttempts.has(email)) {
        loginAttempts.set(email, { count: 0, lastAttempt: Date.now() });
    }
    
    const attempt = loginAttempts.get(email);
    
    if (success) {
        loginAttempts.delete(email);
    } else {
        attempt.count++;
        attempt.lastAttempt = Date.now();
    }
}

// Cifrado básico para datos sensibles (usando btoa/atob para simplicidad)
// En producción, usa librerías de cifrado más seguras
const SecurityUtils = {
    encodeData: (data) => {
        try {
            return btoa(JSON.stringify(data));
        } catch (error) {
            console.error('Error encoding data:', error);
            return null;
        }
    },
    
    decodeData: (encodedData) => {
        try {
            return JSON.parse(atob(encodedData));
        } catch (error) {
            console.error('Error decoding data:', error);
            return null;
        }
    },
    
    // Generar ID seguro para pedidos
    generateSecureOrderId: () => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `ORD_${timestamp}_${random}`.toUpperCase();
    }
};

// Protección contra XSS
function safeInnerHTML(element, text) {
    element.textContent = text;
}

// Validación de URL para imágenes
function isValidImageUrl(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
        return false;
    }
}