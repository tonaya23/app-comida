// js/init-security.js - Inicialización de medidas de seguridad

document.addEventListener('DOMContentLoaded', function() {
    initializeSecurityFeatures();
});

function initializeSecurityFeatures() {
    // Prevenir clickjacking
    if (self !== top) {
        top.location = self.location;
    }
    
    // Configurar headers de seguridad (si es posible en tu entorno)
    const meta = document.createElement('meta');
    meta.httpEquiv = "Content-Security-Policy";
    meta.content = "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://cdnjs.cloudflare.com https://www.gstatic.com https://images.unsplash.com; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;";
    document.head.appendChild(meta);
    
    // Protección contra XSS
    document.addEventListener('input', function(e) {
        if (e.target.type === 'text' || e.target.type === 'email' || e.target.type === 'textarea') {
            e.target.value = sanitizeInput(e.target.value);
        }
    });
    
    console.log('Características de seguridad inicializadas');
}