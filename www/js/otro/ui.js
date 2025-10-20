// ui.js - Funciones de interfaz de usuario

// Mostrar u ocultar navegación inferior
function showBottomNav(show) {
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) {
        bottomNav.style.display = show ? 'flex' : 'none';
    }
}

// Mostrar pantalla específica
function showScreen(screenId) {
    console.log('Mostrando pantalla:', screenId);
    
    // Validar autenticación para pantallas protegidas
    const protectedScreens = ['menu-screen', 'cart-screen', 'profile-screen', 'status-screen', 'confirm-screen', 'detail-screen', 'admin-screen'];
    
    if (!getCurrentUser() && protectedScreens.includes(screenId)) {
        console.log('Redirigiendo a login - usuario no autenticado');
        showScreen('login-screen');
        return;
    }
    
    if (getCurrentUser() && (screenId === 'login-screen' || screenId === 'register-screen')) {
        console.log('Redirigiendo a menú - usuario ya autenticado');
        showScreen('menu-screen');
        return;
    }

    // Ocultar todas las pantallas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar pantalla objetivo
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    } else {
        console.error('Pantalla no encontrada:', screenId);
        return;
    }
    
    // Actualizar navegación inferior
    updateBottomNav(screenId);
    
    // Actualizar pantallas específicas
    if (screenId === 'cart-screen') {
        updateCartScreen();
    } else if (screenId === 'status-screen') {
        updateStatusScreen();
    } else if (screenId === 'profile-screen') {
        updateUserInfo();
    } else if (screenId === 'admin-screen') {
        showAdminPanel();
    }
}

// Actualizar navegación inferior
function updateBottomNav(screenId) {
    const mainScreens = ['menu-screen', 'cart-screen', 'status-screen', 'profile-screen'];
    if (mainScreens.includes(screenId) && getCurrentUser()) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navItem = document.querySelector(`.nav-item[data-screen="${screenId}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // Mostrar opción de admin si es administrador
        const adminNav = document.querySelector('.nav-item[data-screen="admin-screen"]');
        if (adminNav) {
            adminNav.style.display = isAdmin() ? 'flex' : 'none';
        }
    }
}

// Mostrar notificación
function showNotification(message = '¡Notificación!', type = 'success') {
    // Remover notificaciones existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => {
        if (notif.parentNode) {
            notif.parentNode.removeChild(notif);
        }
    });
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'} notification-icon"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

// Limpiar formularios
function clearLoginForm() {
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
}

function clearRegisterForm() {
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('confirm-password').value = '';
}

function clearAllForms() {
    clearLoginForm();
    clearRegisterForm();
    const addressInput = document.getElementById('address');
    if (addressInput) addressInput.value = '';
}