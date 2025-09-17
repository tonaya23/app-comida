# 🍔 App de Comida

## 👥 Equipo  
- **Product Owner:** Ariday Perez  
- **Scrum Master:** Angel Orozco  
- **Development Team:** Ariday Perez, Angel Orozco  
- **Testers:** Ariday Perez, Angel Orozco  

---

## 🎯 Objetivo de la App  
Desarrollar una aplicación móvil para pedidos de comida rápida que permita a los usuarios:  
- Consultar el menú en tiempo real  
- Realizar pedidos desde el celular  
- Recibir notificaciones cuando su pedido esté listo  

---

## 🏗 Metodología de Trabajo  
Se utilizará **Scrum** para organizar el proyecto en sprints cortos de 2 semanas, entregando incrementos funcionales de la app en cada iteración.

---

## 📅 Plan de Proyecto  

### Sprint 1 (2 semanas)  
- Configuración inicial del repositorio en GitHub  
- Definir arquitectura Cliente-Servidor básica  
- Crear interfaz de usuario para el menú (lista de productos con precio e imagen)  
- Implementar pantalla de carrito de compras  

**Entregable:** Prototipo navegable con opción de agregar productos al carrito  

### Sprint 2 (2 semanas)  
- Integrar base de datos para guardar pedidos  
- Implementar notificaciones push con Firebase Cloud Messaging (FCM)  
- Agregar inicio de sesión con correo  
- Pruebas de usabilidad y corrección de errores  

**Entregable:** App funcional en versión Beta que permita realizar un pedido completo y notificar al usuario  

---

## 🏛 Arquitectura de Software  
Arquitectura seleccionada: **Cliente-Servidor con Firebase**  

**Servicios usados:**  
- **Firebase Auth:** Inicio de sesión seguro con correo/teléfono  
- **Cloud Firestore:** Base de datos NoSQL en tiempo real para menú y pedidos  
- **Firebase Cloud Messaging (FCM):** Notificaciones push en Android e iOS  
- **Cloud Functions:** Lógica de backend sin servidores  

**Ventajas:**  
- Eliminación de la necesidad de administrar servidores  
- Escalabilidad automática  
- Sincronización en tiempo real para pedidos y menú  

---

## 📱 Diseño de la App (UX)  
- Pantalla de inicio de sesión  
- Pantalla principal con menú de productos  
- Pantalla de detalle de producto  
- Pantalla de carrito de compras  
- Pantalla de confirmación de pedido  
- Pantalla de estado del pedido  
