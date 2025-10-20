// orders.js - Manejo de pedidos
let orderHistory = [];
let currentOrder = null;

// Crear nuevo pedido
function createOrder(orderData) {
    const orderId = 'ORD' + Date.now().toString().substr(-6);
    
    const newOrder = {
        id: orderId,
        userId: orderData.userId,
        userEmail: orderData.userEmail,
        items: [...orderData.items],
        address: orderData.address,
        payment: orderData.payment,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        taxes: orderData.taxes,
        total: orderData.total,
        status: 'confirmado',
        timestamp: new Date(),
        estimatedDelivery: new Date(Date.now() + 45 * 60000)
    };
    
    currentOrder = newOrder;
    orderHistory.unshift(newOrder);
    
    return orderId;
}

// Obtener todos los pedidos
function getAllOrders() {
    return orderHistory;
}

// Obtener pedidos por usuario
function getOrdersByUser(userId) {
    return orderHistory.filter(order => order.userId === userId);
}

// Obtener pedido actual
function getCurrentOrder() {
    return currentOrder;
}

// Actualizar estado del pedido
function updateOrderStatus(orderId, newStatus) {
    const order = orderHistory.find(order => order.id === orderId);
    if (order) {
        order.status = newStatus;
        
        // Si es el pedido actual, actualizarlo también
        if (currentOrder && currentOrder.id === orderId) {
            currentOrder.status = newStatus;
        }
        
        return true;
    }
    return false;
}

// Obtener pedidos por estado
function getOrdersByStatus(status) {
    return orderHistory.filter(order => order.status === status);
}

// Simular progreso del pedido
function simulateOrderProgress(orderId) {
    const order = orderHistory.find(order => order.id === orderId);
    if (!order) return;
    
    setTimeout(() => {
        updateOrderStatus(orderId, 'en_preparacion');
        if (currentOrder && currentOrder.id === orderId) {
            updateStatusScreen();
        }
        showNotification(`¡El pedido ${orderId} está en preparación!`);
    }, 10000);
    
    setTimeout(() => {
        updateOrderStatus(orderId, 'en_camino');
        if (currentOrder && currentOrder.id === orderId) {
            updateStatusScreen();
        }
        showNotification(`¡El pedido ${orderId} está en camino!`);
    }, 25000);
    
    setTimeout(() => {
        updateOrderStatus(orderId, 'entregado');
        if (currentOrder && currentOrder.id === orderId) {
            updateStatusScreen();
        }
        showNotification(`¡Pedido ${orderId} entregado! ¡Disfruta tu comida!`);
    }, 40000);
}