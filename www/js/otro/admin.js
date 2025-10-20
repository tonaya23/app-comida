// admin.js - Funciones de administrador

// Mostrar panel de administración
function showAdminPanel() {
    if (!isAdmin()) {
        showNotification('Acceso denegado. Solo administradores pueden acceder.', 'error');
        return;
    }
    
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
            
            <button class="btn btn-secondary btn-lg" onclick="showScreen('menu-screen')">
                <i class="fas fa-arrow-left"></i> Volver al Menú
            </button>
        </div>
    `;
    
    document.getElementById('admin-screen').innerHTML = adminHTML;
    setupAdminEventListeners();
}

// Renderizar pedidos en panel admin
function renderOrdersAdmin() {
    const orders = getAllOrders();
    
    if (orders.length === 0) {
        return '<p>No hay pedidos registrados.</p>';
    }
    
    let html = `
        <div class="admin-orders-header">
            <h3>Gestión de Pedidos (${orders.length})</h3>
        </div>
        <div class="admin-orders-list">
    `;
    
    orders.forEach(order => {
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
    const products = getAllProducts();
    
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
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p>${product.description}</p>
                    <div class="product-details">
                        <span class="price">$${product.price}</span>
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
    const orders = getAllOrders();
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(order => order.status === 'entregado').length;
    
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
                        <div class="stat-value">${new Set(orders.map(order => order.userId)).size}</div>
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
        select.addEventListener('change', function() {
            const orderId = this.getAttribute('data-order');
            const newStatus = this.value;
            
            if (updateOrderStatus(orderId, newStatus)) {
                showNotification(`Estado del pedido ${orderId} actualizado a ${newStatus}`);
            }
        });
    });
    
    // Botón agregar producto
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', showProductForm);
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
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            deleteProductConfirmation(productId);
        });
    });
}