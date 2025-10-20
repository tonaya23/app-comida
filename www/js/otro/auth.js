// auth.js - Manejo de autenticación
const auth = firebase.auth();

// Variables globales
let currentUser = null;

// Verificar estado de autenticación
function initializeAuth() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            console.log('Estado de autenticación cambiado:', user ? user.email : 'No user');
            if (user) {
                currentUser = user;
                console.log('Usuario autenticado:', user.email);
                showBottomNav(true);
                checkAdminAccess(user.email);
            } else {
                currentUser = null;
                console.log('No hay usuario autenticado');
                showBottomNav(false);
            }
            resolve(user);
        });
    });
}

// Verificar si es administrador
function checkAdminAccess(email) {
    const isAdmin = email === 'admin@foodexpress.com' || email === 'administrador@foodexpress.com';
    if (isAdmin) {
        console.log('Usuario es administrador');
        // Aquí podrías agregar lógica específica para admin
    }
    return isAdmin;
}

// Manejar inicio de sesión
async function handleLogin(email, password) {
    if (!email || !password) {
        showNotification('Por favor, completa todos los campos', 'error');
        return false;
    }
    
    try {
        console.log('Intentando login con:', email);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        console.log('Login exitoso:', currentUser.email);
        showBottomNav(true);
        showNotification(`¡Bienvenido ${currentUser.email}!`);
        checkAdminAccess(currentUser.email);
        return true;
        
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
                errorMessage = 'Demasiados intentos. Intenta más tarde';
                break;
            default:
                errorMessage = error.message;
        }
        
        showNotification(errorMessage, 'error');
        return false;
    }
}

// Manejar registro
async function handleRegister(email, password, confirmPassword) {
    if (!email || !password || !confirmPassword) {
        showNotification('Por favor, completa todos los campos', 'error');
        return false;
    }
    
    if (password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return false;
    }
    
    if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return false;
    }
    
    try {
        console.log('Intentando registro con:', email);
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        console.log('Registro exitoso:', currentUser.email);
        showBottomNav(true);
        showNotification(`¡Cuenta creada exitosamente! Bienvenido ${currentUser.email}`);
        return true;
        
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
                errorMessage = 'La contraseña es muy débil';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Operación no permitida';
                break;
            default:
                errorMessage = error.message;
        }
        
        showNotification(errorMessage, 'error');
        return false;
    }
}

// Cerrar sesión
function handleLogout() {
    console.log('Cerrando sesión...');
    auth.signOut().then(() => {
        currentUser = null;
        cart = [];
        showBottomNav(false);
        clearAllForms();
        showNotification('Sesión cerrada correctamente');
        showScreen('login-screen');
    }).catch((error) => {
        console.error('Error al cerrar sesión:', error);
        showNotification('Error al cerrar sesión: ' + error.message, 'error');
    });
}

// Obtener usuario actual
function getCurrentUser() {
    return currentUser;
}

// Verificar si es administrador
function isAdmin() {
    if (!currentUser) return false;
    return currentUser.email === 'admin@foodexpress.com' || currentUser.email === 'administrador@foodexpress.com';
}