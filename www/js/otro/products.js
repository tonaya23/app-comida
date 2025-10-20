// products.js - CRUD de productos
let products = {
    hamburguesa: {
        id: 'hamburguesa',
        name: 'Hamburguesa Clásica',
        price: 8.99,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        description: 'Nuestra hamburguesa clásica está hecha con carne 100% de res, lechuga fresca, tomate, queso cheddar y nuestra salsa especial. Servida en pan brioche tostado. Acompañada de papas fritas crujientes.',
        category: 'hamburguesas',
        available: true
    },
    pizza: {
        id: 'pizza',
        name: 'Pizza Pepperoni',
        price: 12.99,
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        description: 'Pizza con salsa de tomate casera, queso mozzarella de primera calidad y pepperoni seleccionado. Horneada en horno de piedra para obtener una corteza crujiente.',
        category: 'pizzas',
        available: true
    },
    ensalada: {
        id: 'ensalada',
        name: 'Ensalada César',
        price: 7.50,
        image: 'https://images.unsplash.com/photo-1559715745-e1b33a271c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        description: 'Fresca ensalada con lechuga romana, crutones caseros, queso parmesano rallado y nuestro aderezo césar secreto. Opción saludable y deliciosa.',
        category: 'ensaladas',
        available: true
    }
};

// Obtener todos los productos
function getAllProducts() {
    return products;
}

// Obtener producto por ID
function getProductById(productId) {
    return products[productId];
}

// Agregar nuevo producto
function addProduct(productData) {
    const newId = generateProductId(productData.name);
    products[newId] = {
        ...productData,
        id: newId
    };
    return newId;
}

// Actualizar producto
function updateProduct(productId, productData) {
    if (products[productId]) {
        products[productId] = { ...products[productId], ...productData };
        return true;
    }
    return false;
}

// Eliminar producto
function deleteProduct(productId) {
    if (products[productId]) {
        delete products[productId];
        return true;
    }
    return false;
}

// Generar ID único para producto
function generateProductId(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

// Obtener productos por categoría
function getProductsByCategory(category) {
    return Object.values(products).filter(product => product.category === category);
}