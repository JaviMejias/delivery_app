# Roadmap de Desarrollo - StockFlow 🚀

Este documento sirve como la guía de ruta para las nuevas funcionalidades propuestas para **StockFlow**. A medida que completemos tareas o decidamos cambiar prioridades, iremos marcando el progreso directamente aquí.

---

## 📋 Resumen del Estado de Desarrollo

- [ ] **Fase 1: Control de Envases en Comodato (Resguardo de Activos)** 🔴 *Pendiente*
- [ ] **Fase 2: Interfaz Móvil PWA para Conductores (Operación en Terreno)** 🟡 *En Progreso*
- [ ] **Fase 3: Panel de Despacho y Monitoreo de Flota en Vivo (Logística)** 🟡 *En Progreso*
- [ ] **Fase 4: Inteligencia de Stock y Conciliación Automatizada (Finanzas)** 🟡 *En Progreso*

---

## 🔍 Detalle de Fases y Tareas

### 📦 Fase 1: Control de Envases en Comodato y Saldos de Clientes
*Foco: Registrar con precisión la posesión física de los envases retornables prestados a clientes, reduciendo pérdidas monetarias.*

- [ ] **Modelado de Datos (Base de Datos)**
  - [ ] Crear el modelo `Comodato` o añadir campos a `User`/`Client` para registrar el saldo de envases en su posesión.
  - [ ] Crear migración para la tabla de transacciones de envases (préstamos y devoluciones).
- [ ] **Lógica de Negocio (Backend)**
  - [ ] Desarrollar servicio para actualizar los saldos de envases automáticamente tras una venta local o de ruta.
  - [ ] Implementar validaciones para evitar que un cliente acumule envases sin autorización.
- [ ] **Interfaz de Usuario (Frontend React)**
  - [ ] Diseñar vista para ver la lista de clientes con saldos de envases (Cilindros de 5kg, 11kg, 15kg, 45kg, etc.).
  - [ ] Crear un modal interactivo para préstamos manuales o devoluciones directas de envases.
  - [ ] Integrar alertas en el Dashboard para clientes inactivos con envases retenidos.

---

### 📱 Fase 2: Interfaz Móvil Simplificada para Conductores (PWA)
*Foco: Digitalizar la operación del conductor en ruta, optimizando las ventas sobre la marcha y la rendición diaria.*

- [ ] **Configuración e Infraestructura**
  - [ ] Configurar soporte PWA básico (service worker y manifest) para la aplicación.
  - [ ] Diseñar layout móvil minimalista y de alto contraste apto para uso bajo la luz del sol.
- [ ] **Flujo del Conductor**
  - [x] Vista de pedidos asignados del día (Integrado en el Radar de conductor).
  - [ ] Pantalla rápida para registrar venta directa en terreno (ingreso de método de pago, cliente y cilindros entregados).
  - [ ] Registro de envases vacíos recibidos en parte de pago.
- [ ] **Integración de Cierre**
  - [x] Automatizar la generación de la propuesta de `RouteSettlement` al final del día basada en el stock inicial del camión, las ventas móviles cargadas y el stock físico devuelto. (Módulo de Rendición de Ruta implementado)

---

### 🚛 Fase 3: Panel de Despacho y Monitoreo de Flota en Vivo
*Foco: Dar visibilidad total en tiempo real de la flota de reparto al despachador central.*

- [x] **Visualización en Mapa**
  - [x] Integrar librería de mapas en el frontend (Vista `Trucks/Map.tsx`).
  - [x] Crear markers interactivos para representar a cada camión (`Truck`).
- [x] **Información de Carga y Estado**
  - [x] Transmisión de GPS simulado y recepción en tiempo real (ActionCable / GPS Controller).
  - [x] Estado dinámico del conductor (Radares y alertas de mantenimiento).
- [ ] **Asignación Rápida**
  - [ ] Permitir arrastrar o asignar pedidos pendientes directamente al camión más cercano desde el mapa.

---

### 📊 Fase 4: Inteligencia de Stock y Conciliación Bancaria Automatizada
*Foco: Automatizar los procesos de compras y la contabilidad interna de caja.*

- [ ] **Asistente de Abastecimiento Predictivo**
  - [ ] Crear servicio `DemandForecastingService` que calcule la tasa de rotación media por bodega.
  - [x] Implementar un panel de alertas de quiebre de stock en la sección de Inventarios (`daily_critical_stock_alert_service.rb`).
  - [ ] Botón de "Auto-Compra" que genere una propuesta de Orden de Compra optimizada.
- [ ] **Conciliador Bancario**
  - [ ] Crear importador de archivos Excel/CSV para cartolas bancarias.
  - [ ] Desarrollar lógica de emparejamiento automático por monto, fecha y tipo de transacción.
  - [ ] Diseñar interfaz interactiva para revisar y aprobar las sugerencias de conciliación automática.

---

## 🛠️ Notas y Decisiones Técnicas

- **UI/UX Estandarizada:** Se implementó un componente reutilizable `TableFilters` para todas las vistas de lista (Inventario, Logística, Tesorería), asegurando una experiencia de búsqueda, filtrado y paginación coherente. Se introdujeron componentes modulares como `PageHeader` y `BackButton`.
- **Exportaciones de Datos:** Se crearon servicios integrados en React para la exportación de tablas a Excel (`useExcelExport.ts`), unificando las capacidades de reporte en los módulos financieros y de logística.
- **Sistema de Alertas:** Se añadieron notificaciones internas en el sistema y alertas push/dashboard relacionadas con niveles críticos de stock y el mantenimiento programado de la flota.
- **Búsquedas Flexibles:** Se integró la limpieza automática de caracteres especiales (puntos y guiones) para rut y patentes a nivel de base de datos (`search_by_query`), optimizando la experiencia del usuario final al buscar.
