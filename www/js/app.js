// app.js - Archivo principal completo con Firestore y API del Clima
// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAo4wwsGtIIfDIH87YnAlJwzFZjp-Z6uTw",
  authDomain: "fastfood-app-e86e6.firebaseapp.com",
  projectId: "fastfood-app-e86e6",
  storageBucket: "fastfood-app-e86e6.firebasestorage.app",
  messagingSenderId: "596828779849",
  appId: "1:596828779849:web:4ac9de41e5e8264a9a5698"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Variables globales
let cart = [];
let currentOrder = null;
let currentUser = null;
let orderHistory = [];
let products = {};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - Inicializando aplicación');
    initializeApp();
});

// Verificar estado de autenticación
function initializeApp() {
    console.log('Inicializando Firebase...');
    
    auth.onAuthStateChanged(async (user) => {
        console.log('Estado de autenticación cambiado:', user ? user.email : 'No user');
        if (user) {
            currentUser = user;
            console.log('Usuario autenticado:', user.email);
            
            // Cargar datos necesarios
            await loadProducts();
            await loadUserOrders();
            
            showBottomNav(true);
            updateAdminNav();
            showScreen('menu-screen');
            showNotification(`¡Bienvenido ${user.email}!`);
            updateUserInfo();
            clearLoginForm();
            clearRegisterForm();
        } else {
            currentUser = null;
            console.log('No hay usuario autenticado');
            showBottomNav(false);
            showScreen('login-screen');
            clearAllForms();
        }
    });
    
    setupEventListeners();
}

// ==============================================
// FUNCIONES DE FIRESTORE
// ==============================================

// Cargar productos desde Firestore
async function loadProducts() {
    try {
        console.log('Cargando productos desde Firestore...');
        const snapshot = await db.collection('products').get();
        products = {};
        
        snapshot.forEach(doc => {
            products[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        console.log('Productos cargados:', Object.keys(products).length);
        
        // Si no hay productos, cargar algunos por defecto
        if (Object.keys(products).length === 0) {
            await initializeDefaultProducts();
        }
        
        updateMenuScreen();
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        showNotification('Error cargando el menú', 'error');
    }
}

// Inicializar productos por defecto
async function initializeDefaultProducts() {
    const defaultProducts = {
        hamburguesa: {
            name: 'Hamburguesa Clásica',
            price: 8.99,
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            description: 'Nuestra hamburguesa clásica está hecha con carne 100% de res, lechuga fresca, tomate, queso cheddar y nuestra salsa especial. Servida en pan brioche tostado. Acompañada de papas fritas crujientes.',
            category: 'hamburguesas',
            available: true
        },
        pizza: {
            name: 'Pizza Pepperoni',
            price: 12.99,
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            description: 'Pizza con salsa de tomate casera, queso mozzarella de primera calidad y pepperoni seleccionado. Horneada en horno de piedra para obtener una corteza crujiente.',
            category: 'pizzas',
            available: true
        },
        ensalada: {
            name: 'Ensalada César',
            price: 7.50,
            image: 'https://images.unsplash.com/photo-1559715745-e1b33a271c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            description: 'Fresca ensalada con lechuga romana, crutones caseros, queso parmesano rallado y nuestro aderezo césar secreto. Opción saludable y deliciosa.',
            category: 'ensaladas',
            available: true
        },
        bebida: {
            name: 'Refresco Grande',
            price: 3.50,
            image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            description: 'Refresco frío de 500ml. Sabores: Coca-Cola, Sprite, Fanta Naranja.',
            category: 'bebidas',
            available: true
        },
        sopa: {
            name: 'Sopa del Día',
            price: 6.99,
            image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            description: 'Sopa casera preparada diariamente. Consulta nuestra sopa del día.',
            category: 'sopas',
            available: true
        }
    };

    try {
        for (const [id, product] of Object.entries(defaultProducts)) {
            await db.collection('products').doc(id).set(product);
        }
        console.log('Productos por defecto creados');
        await loadProducts(); // Recargar productos
    } catch (error) {
        console.error('Error creando productos por defecto:', error);
    }
}

// Cargar pedidos del usuario
async function loadUserOrders() {
    if (!currentUser) return;
    
    try {
        console.log('Cargando pedidos del usuario...');
        let query = db.collection('orders');
        
        // Si no es admin, cargar solo sus pedidos
        if (!isAdmin()) {
            query = query.where('userId', '==', currentUser.uid);
        }
        
        const snapshot = await query.orderBy('timestamp', 'desc').get();
        orderHistory = [];
        
        snapshot.forEach(doc => {
            const orderData = doc.data();
            orderHistory.push({
                id: doc.id,
                ...orderData,
                timestamp: orderData.timestamp.toDate()
            });
        });
        
        console.log('Pedidos cargados:', orderHistory.length);
        
    } catch (error) {
        console.error('Error cargando pedidos:', error);
    }
}

// Guardar pedido en Firestore
async function saveOrder(orderData) {
    try {
        const orderRef = await db.collection('orders').add(orderData);
        console.log('Pedido guardado con ID:', orderRef.id);
        return orderRef.id;
    } catch (error) {
        console.error('Error guardando pedido:', error);
        throw error;
    }
}

// Actualizar estado del pedido en Firestore
async function updateOrderStatus(orderId, newStatus) {
    try {
        await db.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: new Date()
        });
        console.log(`Estado del pedido ${orderId} actualizado a: ${newStatus}`);
        return true;
    } catch (error) {
        console.error('Error actualizando estado del pedido:', error);
        return false;
    }
}

// Guardar producto en Firestore
async function saveProduct(productData) {
    try {
        const productId = generateProductId(productData.name);
        await db.collection('products').doc(productId).set({
            ...productData,
            createdAt: new Date()
        });
        console.log('Producto guardado con ID:', productId);
        return productId;
    } catch (error) {
        console.error('Error guardando producto:', error);
        throw error;
    }
}

// Actualizar producto en Firestore
async function updateProduct(productId, productData) {
    try {
        await db.collection('products').doc(productId).update({
            ...productData,
            updatedAt: new Date()
        });
        console.log('Producto actualizado:', productId);
        return true;
    } catch (error) {
        console.error('Error actualizando producto:', error);
        return false;
    }
}

// Eliminar producto de Firestore
async function deleteProduct(productId) {
    try {
        await db.collection('products').doc(productId).delete();
        console.log('Producto eliminado:', productId);
        return true;
    } catch (error) {
        console.error('Error eliminando producto:', error);
        return false;
    }
}

// ==============================================
// FUNCIONES DE LA APLICACIÓN
// ==============================================

// Mostrar u ocultar navegación inferior
function showBottomNav(show) {
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) {
        bottomNav.style.display = show ? 'flex' : 'none';
    }
}

// Actualizar navegación de admin
function updateAdminNav() {
    const adminNav = document.querySelector('.nav-item[data-screen="admin-screen"]');
    if (adminNav) {
        adminNav.style.display = isAdmin() ? 'flex' : 'none';
    }
}

// Verificar si es administrador
function isAdmin() {
    if (!currentUser) return false;
    return currentUser.email === 'admin@foodexpress.com' || currentUser.email === 'administrador@foodexpress.com';
}

// Configurar event listeners
function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Botones de autenticación
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('register-btn').addEventListener('click', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Navegación entre login y registro
    document.getElementById('go-to-register-btn').addEventListener('click', function() {
        clearLoginForm();
        showScreen('register-screen');
    });
    
    document.getElementById('go-to-login-btn').addEventListener('click', function() {
        clearRegisterForm();
        showScreen('login-screen');
    });
    
    // Navegación general
    document.getElementById('back-from-detail').addEventListener('click', function() {
        showScreen('menu-screen');
    });
    
    document.getElementById('back-to-menu-profile').addEventListener('click', function() {
        showScreen('menu-screen');
    });
    
    document.getElementById('back-to-menu-cart').addEventListener('click', function() {
        showScreen('menu-screen');
    });
    
    document.getElementById('back-to-cart').addEventListener('click', function() {
        showScreen('cart-screen');
    });
    
    // Detalle de producto
    document.getElementById('add-to-cart-detail').addEventListener('click', function() {
        const productId = document.getElementById('detail-screen').getAttribute('data-product');
        if (productId) {
            addToCart(productId);
            showScreen('menu-screen');
        }
    });
    
    // Checkout y pedidos
    document.getElementById('checkout-btn').addEventListener('click', function() {
        if (cart.length === 0) {
            showNotification('Tu carrito está vacío');
            return;
        }
        updateConfirmScreen();
        showScreen('confirm-screen');
    });
    
    document.getElementById('confirm-order-btn').addEventListener('click', placeOrder);
    
    // Navegación inferior
    document.addEventListener('click', function(e) {
        if (e.target.closest('.nav-item') && currentUser) {
            const navItem = e.target.closest('.nav-item');
            const screenId = navItem.getAttribute('data-screen');
            console.log('Navegando a:', screenId);
            
            if (!currentUser) {
                showNotification('Por favor, inicia sesión para acceder a esta función');
                showScreen('login-screen');
                return;
            }
            
            showScreen(screenId);
        }
    });
    
    console.log('Event listeners configurados correctamente');
}

// Actualizar pantalla del menú con productos
function updateMenuScreen() {
    const menuContent = document.getElementById('menu-content');
    if (!menuContent) return;
    
    let menuHTML = '';
    
    Object.values(products).forEach(product => {
        if (product.available) {
            menuHTML += `
                <div class="card" data-product="${product.id}">
                    <div class="card-header">
                        <img src="${product.image}" class="card-img" alt="${product.name}" 
                             onerror="this.src='https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'">
                    </div>
                    <div class="card-body">
                        <h3 class="card-title">${product.name}</h3>
                        <p class="card-text">${product.description}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="card-price">$${product.price.toFixed(2)}</span>
                            <button class="btn btn-primary add-to-cart-btn" data-product="${product.id}">Agregar</button>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    menuContent.innerHTML = menuHTML;
    
    // Configurar event listeners para los nuevos botones
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const productId = this.getAttribute('data-product');
            addToCart(productId);
        });
    });
    
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', function() {
            const productId = this.getAttribute('data-product');
            showProductDetail(productId);
        });
    });
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

// Manejar inicio de sesión
async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const loginBtn = document.getElementById('login-btn');
    
    if (!email || !password) {
        showNotification('Por favor, completa todos los campos', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Por favor, ingresa un email válido', 'error');
        return;
    }
    
    // Mostrar loading
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
    loginBtn.disabled = true;
    
    try {
        console.log('Intentando login con:', email);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        console.log('Login exitoso:', currentUser.email);
        
        // Cargar datos del usuario
        await loadProducts();
        await loadUserOrders();
        
        showBottomNav(true);
        updateAdminNav();
        showNotification(`¡Bienvenido ${currentUser.email}!`);
        showScreen('menu-screen');
        updateUserInfo();
        clearLoginForm();
        
    } catch (error) {
        console.error('Error en login:', error);
        
        let errorMessage = 'Error al iniciar sesión';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Usuario no encontrado';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Contraseña incorrecta';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Demasiados intentos. Tu cuenta ha sido temporalmente bloqueada por seguridad.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Esta cuenta ha sido deshabilitada';
                break;
            default:
                errorMessage = 'Error de autenticación. Por favor, intenta nuevamente.';
        }
        
        showNotification(errorMessage, 'error');
    }
    
    // Restaurar botón
    loginBtn.innerHTML = 'Iniciar Sesión';
    loginBtn.disabled = false;
}

// Manejar registro
async function handleRegister() {
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const registerBtn = document.getElementById('register-btn');
    
    if (!email || !password || !confirmPassword) {
        showNotification('Por favor, completa todos los campos', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Por favor, ingresa un email válido', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    // Mostrar loading
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    registerBtn.disabled = true;
    
    try {
        console.log('Intentando registro con:', email);
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        console.log('Registro exitoso:', currentUser.email);
        
        // Crear perfil de usuario en Firestore
        await db.collection('users').doc(currentUser.uid).set({
            email: currentUser.email,
            createdAt: new Date(),
            role: 'customer',
            lastLogin: new Date()
        });
        
        // Cargar datos del usuario
        await loadProducts();
        await loadUserOrders();
        
        showBottomNav(true);
        updateAdminNav();
        showNotification(`¡Cuenta creada exitosamente! Bienvenido ${currentUser.email}`);
        showScreen('menu-screen');
        updateUserInfo();
        clearRegisterForm();
        
    } catch (error) {
        console.error('Error en registro:', error);
        let errorMessage = 'Error al registrar usuario';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este email ya está registrado';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido';
                break;
            case 'auth/weak-password':
                errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Operación no permitida';
                break;
            default:
                errorMessage = error.message;
        }
        
        showNotification(errorMessage, 'error');
    }
    
    // Restaurar botón
    registerBtn.innerHTML = 'Crear Cuenta';
    registerBtn.disabled = false;
}

// Cerrar sesión
function handleLogout() {
    console.log('Cerrando sesión...');
    auth.signOut().then(() => {
        currentUser = null;
        cart = [];
        orderHistory = [];
        showBottomNav(false);
        clearAllForms();
        showNotification('Sesión cerrada correctamente');
        showScreen('login-screen');
    }).catch((error) => {
        console.error('Error al cerrar sesión:', error);
        showNotification('Error al cerrar sesión: ' + error.message, 'error');
    });
}

// Actualizar información del usuario
function updateUserInfo() {
    const userEmailElement = document.getElementById('user-email');
    const memberSinceElement = document.getElementById('member-since');
    
    if (userEmailElement && currentUser) {
        userEmailElement.textContent = currentUser.email;
    }
    
    if (memberSinceElement && currentUser) {
        const now = new Date();
        memberSinceElement.textContent = now.toLocaleDateString('es-ES');
    }
}

// FUNCIÓN showScreen ACTUALIZADA CON API DEL CLIMA
function showScreen(screenId) {
    console.log('Mostrando pantalla:', screenId);
    
    // Validar autenticación para pantallas protegidas
    const protectedScreens = ['menu-screen', 'cart-screen', 'profile-screen', 'status-screen', 'confirm-screen', 'detail-screen', 'admin-screen'];
    
    if (!currentUser && protectedScreens.includes(screenId)) {
        console.log('Redirigiendo a login - usuario no autenticado');
        showScreen('login-screen');
        return;
    }
    
    if (currentUser && (screenId === 'login-screen' || screenId === 'register-screen')) {
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
    
    // Actualizar navegación inferior (solo para pantallas principales y cuando el usuario está autenticado)
    const mainScreens = ['menu-screen', 'cart-screen', 'status-screen', 'profile-screen', 'admin-screen'];
    if (mainScreens.includes(screenId) && currentUser) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navItem = document.querySelector(`.nav-item[data-screen="${screenId}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
    }
    
    // Actualizar pantallas específicas
    if (screenId === 'cart-screen') {
        updateCartScreen();
    } else if (screenId === 'status-screen') {
        updateStatusScreen();
    } else if (screenId === 'profile-screen' && currentUser) {
        updateUserInfo();
    } else if (screenId === 'admin-screen') {
        showAdminPanel();
    } else if (screenId === 'menu-screen') {
        updateMenuScreen();
        
        // 🔥 NUEVA INTEGRACIÓN: Inicializar API del Clima cuando se muestra el menú
        if (currentUser) {
            // Esperar un poco para que el DOM se actualice completamente
            setTimeout(() => {
                if (typeof initializeWeatherWidget === 'function') {
                    console.log('Inicializando widget del clima...');
                    initializeWeatherWidget();
                } else {
                    console.log('Weather API no disponible aún');
                    // Mostrar widget de clima por defecto si la API no está cargada
                    showDefaultWeatherWidget();
                }
            }, 300);
        }
    }
}

// Función para mostrar widget de clima por defecto (si la API falla)
function showDefaultWeatherWidget() {
    const weatherWidget = document.getElementById('weather-widget');
    const recommendationElement = document.getElementById('weather-recommendation');
    
    if (weatherWidget) {
        weatherWidget.innerHTML = `
            <div class="weather-header">
                <i class="fas fa-cloud-sun weather-icon"></i>
                <div class="weather-temp">24°C</div>
            </div>
            <div class="weather-info">
                <div class="weather-city">Tu Ciudad</div>
                <div class="weather-desc">parcialmente nublado</div>
                <div class="weather-details">
                    <span><i class="fas fa-wind"></i> 3.5 m/s</span>
                    <span><i class="fas fa-tint"></i> 65%</span>
                </div>
            </div>
        `;
    }
    
    if (recommendationElement) {
        recommendationElement.innerHTML = `
            <div class="weather-recommendation">
                <div class="recommendation-emoji">😊🍽️</div>
                <div class="recommendation-text">¡Clima perfecto! Disfruta de nuestro menú completo</div>
            </div>
        `;
    }
}

// Mostrar detalle de producto
function showProductDetail(productId) {
    const product = products[productId];
    if (!product) return;
    
    document.getElementById('detail-img').src = product.image;
    document.getElementById('detail-title').textContent = product.name;
    document.getElementById('detail-price').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('detail-desc').textContent = product.description;
    document.getElementById('detail-screen').setAttribute('data-product', productId);
    
    // Limpiar checkboxes de ingredientes adicionales
    document.getElementById('bacon').checked = false;
    document.getElementById('avocado').checked = false;
    document.getElementById('egg').checked = false;
    
    showScreen('detail-screen');
}

// Agregar al carrito
function addToCart(productId) {
    if (!currentUser) {
        showNotification('Por favor, inicia sesión para agregar productos al carrito', 'error');
        showScreen('login-screen');
        return;
    }
    
    const product = products[productId];
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    showNotification(`${product.name} agregado al carrito`);
    updateCartScreen();
}

// Actualizar pantalla del carrito
function updateCartScreen() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Tu carrito está vacío</p>';
        document.getElementById('checkout-btn').disabled = true;
        return;
    }
    
    document.getElementById('checkout-btn').disabled = false;
    
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <img src="${item.image}" class="cart-item-img" alt="${item.name}" 
                 onerror="this.src='https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn minus-btn" data-id="${item.id}">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn plus-btn" data-id="${item.id}">+</button>
            </div>
        `;
        
        cartItemsContainer.appendChild(cartItemElement);
    });
    
    // Event listeners para botones de cantidad
    document.querySelectorAll('.minus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            updateQuantity(productId, -1);
        });
    });
    
    document.querySelectorAll('.plus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            updateQuantity(productId, 1);
        });
    });
    
    const shipping = 2.50;
    const taxes = subtotal * 0.08;
    const total = subtotal + shipping + taxes;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('taxes').textContent = `$${taxes.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// Actualizar cantidad de producto
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        cart = cart.filter(item => item.id !== productId);
        showNotification('Producto eliminado del carrito');
    }
    
    updateCartScreen();
}

// Actualizar pantalla de confirmación
function updateConfirmScreen() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 2.50;
    const taxes = subtotal * 0.08;
    const total = subtotal + shipping + taxes;
    
    document.getElementById('confirm-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('confirm-taxes').textContent = `$${taxes.toFixed(2)}`;
    document.getElementById('confirm-total').textContent = `$${total.toFixed(2)}`;
}

// Realizar pedido
async function placeOrder() {
    if (!currentUser) {
        showNotification('Por favor, inicia sesión para realizar un pedido', 'error');
        showScreen('login-screen');
        return;
    }
    
    const address = document.getElementById('address').value.trim();
    const payment = document.getElementById('payment').value;
    
    if (!address) {
        showNotification('Por favor, ingresa una dirección de entrega', 'error');
        return;
    }
    
    if (address.length < 10) {
        showNotification('Por favor, ingresa una dirección más específica', 'error');
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 2.50;
    const taxes = subtotal * 0.08;
    const total = subtotal + shipping + taxes;
    
    // Crear objeto de pedido
    const orderData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        address: address,
        payment: payment,
        subtotal: subtotal,
        shipping: shipping,
        taxes: taxes,
        total: total,
        status: 'confirmado',
        timestamp: new Date(),
        estimatedDelivery: new Date(Date.now() + 45 * 60000) // 45 minutos desde ahora
    };
    
    try {
        // Guardar pedido en Firestore
        const orderId = await saveOrder(orderData);
        
        // Actualizar variables locales
        currentOrder = {
            id: orderId,
            ...orderData
        };
        
        orderHistory.unshift(currentOrder);
        
        // Limpiar carrito
        cart = [];
        document.getElementById('address').value = '';
        
        // Recargar pedidos para asegurar consistencia
        await loadUserOrders();
        
        updateStatusScreen();
        showScreen('status-screen');
        
        showNotification('¡Pedido confirmado! Tu comida está en camino');
        
        // Simular progreso del pedido
        simulateOrderProgress(orderId);
        
    } catch (error) {
        console.error('Error realizando pedido:', error);
        showNotification('Error al realizar el pedido', 'error');
    }
}

// Simular progreso del pedido
function simulateOrderProgress(orderId) {
    setTimeout(async () => {
        await updateOrderStatus(orderId, 'en_preparacion');
        await loadUserOrders(); // Recargar pedidos
        if (currentOrder && currentOrder.id === orderId) {
            updateStatusScreen();
        }
        showNotification(`¡El pedido ${orderId} está en preparación!`);
    }, 10000);
    
    setTimeout(async () => {
        await updateOrderStatus(orderId, 'en_camino');
        await loadUserOrders();
        if (currentOrder && currentOrder.id === orderId) {
            updateStatusScreen();
        }
        showNotification(`¡El pedido ${orderId} está en camino!`);
    }, 25000);
    
    setTimeout(async () => {
        await updateOrderStatus(orderId, 'entregado');
        await loadUserOrders();
        if (currentOrder && currentOrder.id === orderId) {
            updateStatusScreen();
        }
        showNotification(`¡Pedido ${orderId} entregado! ¡Disfruta tu comida!`);
    }, 40000);
}

// Actualizar pantalla de estado
function updateStatusScreen() {
    const orderStatusContent = document.getElementById('order-status-content');
    
    if (orderHistory.length === 0) {
        // No hay pedidos
        orderStatusContent.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-shopping-bag" style="font-size: 80px; color: #ccc; margin-bottom: 20px;"></i>
                <h2>No hay pedidos activos</h2>
                <p>Aún no has realizado ningún pedido.</p>
                <button class="btn btn-primary btn-lg" id="back-to-menu-status">
                    <i class="fas fa-utensils"></i> Ver Menú
                </button>
            </div>
        `;
        
        // Agregar event listener al botón
        setTimeout(() => {
            const backButton = document.getElementById('back-to-menu-status');
            if (backButton) {
                backButton.addEventListener('click', function() {
                    showScreen('menu-screen');
                });
            }
        }, 100);
        return;
    }
    
    const orderToShow = orderHistory[0];
    
    let statusIcon = 'fa-clock';
    let statusTitle = 'Pedido Confirmado';
    let statusMessage = `Tu pedido ${orderToShow.id} ha sido confirmado y está siendo preparado.`;
    let progressWidth = '25%';
    let activeSteps = 1;
    
    switch (orderToShow.status) {
        case 'en_preparacion':
            statusIcon = 'fa-utensils';
            statusTitle = 'En Preparación';
            statusMessage = `Tu pedido ${orderToShow.id} está siendo preparado en la cocina.`;
            progressWidth = '50%';
            activeSteps = 2;
            break;
        case 'en_camino':
            statusIcon = 'fa-motorcycle';
            statusTitle = 'En Camino';
            statusMessage = `¡Tu pedido ${orderToShow.id} está en camino! El repartidor llegará pronto.`;
            progressWidth = '75%';
            activeSteps = 3;
            break;
        case 'entregado':
            statusIcon = 'fa-check-circle';
            statusTitle = '¡Entregado!';
            statusMessage = `Tu pedido ${orderToShow.id} ha sido entregado. ¡Esperamos que disfrutes tu comida!`;
            progressWidth = '100%';
            activeSteps = 4;
            break;
    }
    
    const formattedTime = orderToShow.estimatedDelivery.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    orderStatusContent.innerHTML = `
        <i class="fas ${statusIcon} status-icon" style="color: ${orderToShow.status === 'entregado' ? '#28a745' : '#ff7b00'};"></i>
        <h2 class="status-title">${statusTitle}</h2>
        <p class="status-message">${statusMessage}</p>
        
        <div class="progress-container">
            <div class="progress-steps">
                <div class="step ${activeSteps >= 1 ? 'active' : ''}">
                    1
                    <span class="step-label">Confirmado</span>
                </div>
                <div class="step ${activeSteps >= 2 ? 'active' : ''}">
                    2
                    <span class="step-label">En Preparación</span>
                </div>
                <div class="step ${activeSteps >= 3 ? 'active' : ''}">
                    3
                    <span class="step-label">En Camino</span>
                </div>
                <div class="step ${activeSteps >= 4 ? 'active' : ''}">
                    4
                    <span class="step-label">Entregado</span>
                </div>
                <div class="progress-bar" style="width: ${progressWidth};"></div>
            </div>
        </div>
        
        <div class="order-summary">
            <h3>Resumen del Pedido</h3>
            <div class="summary-item">
                <span>Número de Pedido</span>
                <span>${orderToShow.id}</span>
            </div>
            <div class="summary-item">
                <span>Productos</span>
                <span>${orderToShow.items.length} items</span>
            </div>
            <div class="summary-item">
                <span>Estimado de Entrega</span>
                <span>${formattedTime}</span>
            </div>
            <div class="summary-item">
                <span>Dirección</span>
                <span style="text-align: right;">${orderToShow.address}</span>
            </div>
            <div class="summary-total">
                <span>Total</span>
                <span>$${orderToShow.total.toFixed(2)}</span>
            </div>
        </div>
        
        <button class="btn btn-primary btn-lg" id="back-to-menu-from-status">
            ${orderToShow.status === 'entregado' ? 'Realizar otro Pedido' : 'Seguir Comprando'}
        </button>
        
        ${orderHistory.length > 1 ? `
            <button class="btn btn-secondary btn-lg" id="view-history-btn" style="margin-top: 10px;">
                <i class="fas fa-history"></i> Ver Historial de Pedidos
            </button>
        ` : ''}
    `;
    
    // Agregar event listeners
    setTimeout(() => {
        const backButton = document.getElementById('back-to-menu-from-status');
        if (backButton) {
            backButton.addEventListener('click', function() {
                showScreen('menu-screen');
            });
        }
        
        const historyButton = document.getElementById('view-history-btn');
        if (historyButton) {
            historyButton.addEventListener('click', function() {
                showOrderHistory();
            });
        }
    }, 100);
}

// Mostrar historial de pedidos
function showOrderHistory() {
    const orderStatusContent = document.getElementById('order-status-content');
    
    if (orderHistory.length === 0) {
        orderStatusContent.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-shopping-bag" style="font-size: 80px; color: #ccc; margin-bottom: 20px;"></i>
                <h2>No hay pedidos anteriores</h2>
                <p>Aún no has realizado ningún pedido.</p>
            </div>
        `;
        return;
    }
    
    let historyHTML = `
        <div class="history-header">
            <button class="btn btn-secondary" id="back-to-current-order" style="margin-bottom: 20px;">
                <i class="fas fa-arrow-left"></i> Volver al Pedido Actual
            </button>
            <h2>Historial de Pedidos</h2>
        </div>
        <div class="order-history">
    `;
    
    orderHistory.forEach((order, index) => {
        const orderDate = order.timestamp.toLocaleDateString('es-ES');
        const orderTime = order.timestamp.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        let statusBadge = '';
        switch (order.status) {
            case 'confirmado':
                statusBadge = '<span class="status-badge preparing">Preparando</span>';
                break;
            case 'en_preparacion':
                statusBadge = '<span class="status-badge preparing">En Cocina</span>';
                break;
            case 'en_camino':
                statusBadge = '<span class="status-badge onway">En Camino</span>';
                break;
            case 'entregado':
                statusBadge = '<span class="status-badge delivered">Entregado</span>';
                break;
        }
        
        historyHTML += `
            <div class="history-item ${index === 0 ? 'current' : ''}">
                <div class="history-item-header">
                    <div class="order-info">
                        <strong>${order.id}</strong>
                        <span class="order-date">${orderDate} ${orderTime}</span>
                    </div>
                    ${statusBadge}
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span>${item.quantity}x ${item.name}</span>
                            <span>$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    <strong>Total: $${order.total.toFixed(2)}</strong>
                </div>
            </div>
        `;
    });
    
    historyHTML += '</div>';
    
    orderStatusContent.innerHTML = historyHTML;
    
    // Agregar event listener para volver
    setTimeout(() => {
        const backButton = document.getElementById('back-to-current-order');
        if (backButton) {
            backButton.addEventListener('click', function() {
                updateStatusScreen();
            });
        }
    }, 100);
}

// ==============================================
// FUNCIONES DE ADMINISTRADOR
// ==============================================

// Mostrar panel de administración
async function showAdminPanel() {
    if (!isAdmin()) {
        showNotification('Acceso denegado. Solo administradores pueden acceder.', 'error');
        showScreen('menu-screen');
        return;
    }
    
    // Asegurarse de que tenemos los datos más recientes
    await loadUserOrders();
    
    const adminHTML = `
        <div class="admin-panel">
            <h2>Panel de Administración</h2>
            
            <div class="admin-tabs">
                <button class="admin-tab active" data-tab="orders">Pedidos</button>
                <button class="admin-tab" data-tab="products">Productos</button>
                <button class="admin-tab" data-tab="stats">Estadísticas</button>
            </div>
            
            <div class="admin-content">
                <div id="admin-orders" class="admin-tab-content active">
                    ${renderOrdersAdmin()}
                </div>
                <div id="admin-products" class="admin-tab-content">
                    ${renderProductsAdmin()}
                </div>
                <div id="admin-stats" class="admin-tab-content">
                    ${renderStatsAdmin()}
                </div>
            </div>
            
            <button class="btn btn-secondary btn-lg" id="back-to-menu-admin" style="margin-top: 20px;">
                <i class="fas fa-arrow-left"></i> Volver al Menú
            </button>
        </div>
    `;
    
    document.getElementById('admin-screen').innerHTML = adminHTML;
    setupAdminEventListeners();
}

// Renderizar pedidos en panel admin
function renderOrdersAdmin() {
    if (orderHistory.length === 0) {
        return '<p>No hay pedidos registrados.</p>';
    }
    
    let html = `
        <div class="admin-orders-header">
            <h3>Gestión de Pedidos (${orderHistory.length})</h3>
        </div>
        <div class="admin-orders-list">
    `;
    
    orderHistory.forEach(order => {
        const orderDate = order.timestamp.toLocaleDateString('es-ES');
        const orderTime = order.timestamp.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        let statusBadge = '';
        switch (order.status) {
            case 'confirmado':
                statusBadge = '<span class="status-badge confirmed">Confirmado</span>';
                break;
            case 'en_preparacion':
                statusBadge = '<span class="status-badge preparing">En Preparación</span>';
                break;
            case 'en_camino':
                statusBadge = '<span class="status-badge onway">En Camino</span>';
                break;
            case 'entregado':
                statusBadge = '<span class="status-badge delivered">Entregado</span>';
                break;
        }
        
        html += `
            <div class="admin-order-item">
                <div class="order-header">
                    <div class="order-info">
                        <strong>${order.id}</strong>
                        <span class="order-user">Cliente: ${order.userEmail}</span>
                        <span class="order-date">${orderDate} ${orderTime}</span>
                    </div>
                    <div class="order-actions">
                        ${statusBadge}
                        <select class="status-select" data-order="${order.id}">
                            <option value="confirmado" ${order.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                            <option value="en_preparacion" ${order.status === 'en_preparacion' ? 'selected' : ''}>En Preparación</option>
                            <option value="en_camino" ${order.status === 'en_camino' ? 'selected' : ''}>En Camino</option>
                            <option value="entregado" ${order.status === 'entregado' ? 'selected' : ''}>Entregado</option>
                        </select>
                    </div>
                </div>
                
                <div class="order-details">
                    <div class="order-items">
                        <strong>Productos:</strong>
                        ${order.items.map(item => `
                            <div class="order-item">
                                ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="order-summary">
                        <div class="summary-item">
                            <span>Dirección:</span>
                            <span>${order.address}</span>
                        </div>
                        <div class="summary-item">
                            <span>Pago:</span>
                            <span>${order.payment}</span>
                        </div>
                        <div class="summary-total">
                            <span>Total:</span>
                            <span>$${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Renderizar productos en panel admin
function renderProductsAdmin() {
    let html = `
        <div class="admin-products-header">
            <h3>Gestión de Productos</h3>
            <button class="btn btn-primary" id="add-product-btn">
                <i class="fas fa-plus"></i> Agregar Producto
            </button>
        </div>
        <div class="admin-products-list">
    `;
    
    Object.values(products).forEach(product => {
        html += `
            <div class="admin-product-item">
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.src='https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p>${product.description}</p>
                    <div class="product-details">
                        <span class="price">$${product.price.toFixed(2)}</span>
                        <span class="category">${product.category}</span>
                        <span class="availability ${product.available ? 'available' : 'unavailable'}">
                            ${product.available ? 'Disponible' : 'No disponible'}
                        </span>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="btn btn-secondary edit-product" data-id="${product.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger delete-product" data-id="${product.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Renderizar estadísticas en panel admin
function renderStatsAdmin() {
    const totalRevenue = orderHistory.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orderHistory.length;
    const deliveredOrders = orderHistory.filter(order => order.status === 'entregado').length;
    const uniqueCustomers = new Set(orderHistory.map(order => order.userId)).size;
    
    return `
        <div class="admin-stats">
            <h3>Estadísticas del Sistema</h3>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${totalOrders}</div>
                        <div class="stat-label">Total Pedidos</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">$${totalRevenue.toFixed(2)}</div>
                        <div class="stat-label">Ingresos Totales</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${deliveredOrders}</div>
                        <div class="stat-label">Pedidos Entregados</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">${uniqueCustomers}</div>
                        <div class="stat-label">Clientes Únicos</div>
                    </div>
                </div>
            </div>
            
            <div class="stats-charts">
                <h4>Pedidos por Estado</h4>
                <div class="status-chart">
                    ${renderStatusChart()}
                </div>
            </div>
        </div>
    `;
}

// Renderizar gráfico de estados
function renderStatusChart() {
    const statusCounts = {
        confirmado: orderHistory.filter(order => order.status === 'confirmado').length,
        en_preparacion: orderHistory.filter(order => order.status === 'en_preparacion').length,
        en_camino: orderHistory.filter(order => order.status === 'en_camino').length,
        entregado: orderHistory.filter(order => order.status === 'entregado').length
    };
    
    const total = orderHistory.length;
    
    return `
        <div class="chart-bars">
            <div class="chart-bar">
                <div class="bar-label">Confirmado</div>
                <div class="bar-container">
                    <div class="bar-fill confirmed" style="width: ${total > 0 ? (statusCounts.confirmado / total) * 100 : 0}%"></div>
                </div>
                <div class="bar-value">${statusCounts.confirmado}</div>
            </div>
            <div class="chart-bar">
                <div class="bar-label">En Preparación</div>
                <div class="bar-container">
                    <div class="bar-fill preparing" style="width: ${total > 0 ? (statusCounts.en_preparacion / total) * 100 : 0}%"></div>
                </div>
                <div class="bar-value">${statusCounts.en_preparacion}</div>
            </div>
            <div class="chart-bar">
                <div class="bar-label">En Camino</div>
                <div class="bar-container">
                    <div class="bar-fill onway" style="width: ${total > 0 ? (statusCounts.en_camino / total) * 100 : 0}%"></div>
                </div>
                <div class="bar-value">${statusCounts.en_camino}</div>
            </div>
            <div class="chart-bar">
                <div class="bar-label">Entregado</div>
                <div class="bar-container">
                    <div class="bar-fill delivered" style="width: ${total > 0 ? (statusCounts.entregado / total) * 100 : 0}%"></div>
                </div>
                <div class="bar-value">${statusCounts.entregado}</div>
            </div>
        </div>
    `;
}

// Configurar event listeners del admin
function setupAdminEventListeners() {
    // Tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Actualizar tabs
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Actualizar contenido
            document.querySelectorAll('.admin-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`admin-${tabId}`).classList.add('active');
        });
    });
    
    // Cambiar estado de pedidos
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async function() {
            const orderId = this.getAttribute('data-order');
            const newStatus = this.value;
            
            const success = await updateOrderStatus(orderId, newStatus);
            if (success) {
                showNotification(`Estado del pedido ${orderId} actualizado a ${newStatus}`);
                // Recargar datos y actualizar la vista
                await loadUserOrders();
                showAdminPanel();
            } else {
                showNotification('Error actualizando el estado del pedido', 'error');
            }
        });
    });
    
    // Botón agregar producto
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            showProductForm();
        });
    }
    
    // Botones editar producto
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            showProductForm(productId);
        });
    });
    
    // Botones eliminar producto
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', async function() {
            const productId = this.getAttribute('data-id');
            const product = products[productId];
            
            if (confirm(`¿Estás seguro de que quieres eliminar el producto "${product.name}"?`)) {
                const success = await deleteProduct(productId);
                if (success) {
                    showNotification(`Producto "${product.name}" eliminado`, 'success');
                    await loadProducts(); // Recargar productos
                    showAdminPanel(); // Actualizar panel
                } else {
                    showNotification('Error eliminando el producto', 'error');
                }
            }
        });
    });
    
    // Botón volver al menú
    const backButton = document.getElementById('back-to-menu-admin');
    if (backButton) {
        backButton.addEventListener('click', function() {
            showScreen('menu-screen');
        });
    }
}

// Mostrar formulario de producto
function showProductForm(productId = null) {
    const product = productId ? products[productId] : null;
    
    const formHTML = `
        <div class="product-form">
            <h3>${product ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h3>
            <form id="product-form">
                <div class="form-group">
                    <label for="product-name">Nombre del Producto</label>
                    <input type="text" id="product-name" class="form-control" value="${product ? product.name : ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="product-price">Precio</label>
                    <input type="number" id="product-price" class="form-control" step="0.01" min="0" value="${product ? product.price : ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="product-category">Categoría</label>
                    <select id="product-category" class="form-control" required>
                        <option value="">Seleccionar categoría</option>
                        <option value="hamburguesas" ${product && product.category === 'hamburguesas' ? 'selected' : ''}>Hamburguesas</option>
                        <option value="pizzas" ${product && product.category === 'pizzas' ? 'selected' : ''}>Pizzas</option>
                        <option value="ensaladas" ${product && product.category === 'ensaladas' ? 'selected' : ''}>Ensaladas</option>
                        <option value="bebidas" ${product && product.category === 'bebidas' ? 'selected' : ''}>Bebidas</option>
                        <option value="sopas" ${product && product.category === 'sopas' ? 'selected' : ''}>Sopas</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="product-image">URL de la Imagen</label>
                    <input type="url" id="product-image" class="form-control" value="${product ? product.image : ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="product-description">Descripción</label>
                    <textarea id="product-description" class="form-control" rows="3" required>${product ? product.description : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="product-available" ${product ? (product.available ? 'checked' : '') : 'checked'}>
                        Producto disponible
                    </label>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">${product ? 'Actualizar' : 'Agregar'} Producto</button>
                    <button type="button" class="btn btn-secondary" onclick="showAdminPanel()">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('admin-products').innerHTML = formHTML;
    
    // Configurar el submit del formulario
    document.getElementById('product-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleProductSubmit(productId);
    });
}

// Manejar envío del formulario de producto
async function handleProductSubmit(productId = null) {
    const formData = {
        name: document.getElementById('product-name').value.trim(),
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        image: document.getElementById('product-image').value.trim(),
        description: document.getElementById('product-description').value.trim(),
        available: document.getElementById('product-available').checked
    };
    
    // Validaciones básicas
    if (!formData.name || !formData.category || !formData.image || !formData.description) {
        showNotification('Por favor, completa todos los campos', 'error');
        return;
    }
    
    if (formData.price <= 0) {
        showNotification('El precio debe ser mayor a 0', 'error');
        return;
    }
    
    try {
        if (productId) {
            // Actualizar producto existente
            await updateProduct(productId, formData);
            showNotification('Producto actualizado correctamente', 'success');
        } else {
            // Crear nuevo producto
            await saveProduct(formData);
            showNotification('Producto agregado correctamente', 'success');
        }
        
        // Recargar productos y volver al panel
        await loadProducts();
        showAdminPanel();
        
    } catch (error) {
        console.error('Error guardando producto:', error);
        showNotification('Error guardando el producto', 'error');
    }
}

// Generar ID de producto
function generateProductId(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
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
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'info' ? 'fa-info-circle' : 'fa-check-circle'} notification-icon"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

// Validación de email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Obtener usuario actual (para weather.js)
function getCurrentUser() {
    return currentUser;
}

// Cordova ready
document.addEventListener('deviceready', function() {
    console.log('Cordova está listo');
    // Aquí puedes agregar código específico de Cordova si es necesario
}, false);