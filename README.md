# StockFlow

StockFlow es una plataforma web multiempresa para administrar la operación completa de una distribuidora: catálogo, compras, inventario, venta local, flota, pedidos a domicilio, rendiciones y tesorería. Además del ERP administrativo, incluye un flujo de despacho georreferenciado tipo *last mile*: el cliente ubica su entrega en un mapa, los pedidos aparecen en el radar de los conductores y el avance del despacho se comunica en tiempo real.

El proyecto está orientado especialmente a operaciones con productos y envases retornables —por ejemplo, distribución de cilindros—, aunque su modelo de productos, bodegas y flota permite adaptarlo a otros escenarios de reparto.

## Alcance funcional

### Operación multiempresa y usuarios

- Varias empresas dentro de una misma instalación, aisladas mediante `acts_as_tenant`.
- Cambio de empresa activa para usuarios con acceso a más de una organización.
- Autenticación con Devise y perfiles administrativos, operativos y de conductor.
- Asignación de usuarios a empresas y bodegas; activación o desactivación de cuentas.
- Datos corporativos, logo, teléfonos y portal público configurable por empresa.

### Catálogo y precios

- Administración de categorías de materiales, materiales, marcas, productos y proveedores.
- Diferenciación entre producto lleno y material/envase retornable.
- SKU, estado activo, disponibilidad en el portal y umbral individual de stock crítico.
- Listas de precios con vigencias y disponibilidad diferenciada para venta local o camiones.
- Productos compatibles con voucher y recargos de tarjeta configurables por bodega.

### Inventario y bodegas

- Stock por empresa y bodega, incluyendo bodegas físicas y stock cargado en camiones.
- Inventario polimórfico para productos terminados y envases/materiales vacíos.
- Transferencias entre bodegas con preparación de ítems, confirmación y guía interna en PDF.
- Ajustes manuales con motivo y movimientos de stock trazables.
- Actualización automática de existencias al recibir compras, cerrar ventas o completar rendiciones.
- Consulta filtrable y exportación a Excel.
- Alertas de stock crítico según el umbral de cada producto.

### Compras y cuentas por pagar

- Órdenes de compra con proveedor, ítems, IVA, recepción parcial o total y PDF imprimible.
- Documentos de compra: facturas, notas de crédito y documentos relacionados.
- Adjuntos mediante Active Storage.
- Estados de borrador, finalización, pago y anulación.
- El ingreso o reversa de documentos actualiza inventario mediante movimientos auditables.
- Exportación de órdenes y documentos a Excel.

### Venta local y caja

- Punto de venta para registrar productos, cantidades y devoluciones de envases.
- Medios de pago: efectivo, tarjeta, transferencia y voucher.
- Cálculo de recargo por tarjeta según la configuración de la bodega.
- Cierres de caja con comparación entre valores calculados y montos declarados.
- Historial, filtros y exportaciones a Excel.

### Pedidos públicos y experiencia del cliente

Cada empresa puede habilitar su portal en `/order/:company_slug`.

- Compra como invitado o mediante cuenta de cliente.
- Catálogo público restringido a productos habilitados y sus precios vigentes.
- Selección de dirección en mapa, geocodificación y geocodificación inversa.
- Carrito de productos, pedido rápido, notas y cálculo del total.
- Libreta de direcciones con dirección predeterminada.
- Historial mensual y opción de repetir un pedido anterior.
- Seguimiento mediante un token público difícil de adivinar.
- Cancelación por el cliente mientras el pedido siga pendiente.
- Bloqueo automático después de tres cancelaciones en 24 horas y desbloqueo administrativo.

### Despacho georreferenciado tipo “Uber”

El flujo conecta tres vistas de una misma operación:

1. **Cliente:** crea el pedido indicando el punto exacto de entrega y abre su pantalla de seguimiento.
2. **Central de despacho:** ve camiones, carga, conductor, destinos y pedidos pendientes sobre un mapa; puede crear pedidos, asignarlos a un vehículo, cancelar despachos y seguir unidades.
3. **Conductor:** utiliza un radar móvil para ver pedidos cercanos, consultar distancia y detalle, aceptar uno, rechazar una propuesta, compartir ubicación y completar o cancelar la entrega.

Capacidades implementadas:

- Mapa interactivo con Leaflet y cartografía de OpenStreetMap.
- Rutas viales calculadas con OSRM y alternativa lineal si el servicio no responde.
- Ubicación del conductor desde la geolocalización del navegador.
- API para dispositivos GPS externos autenticados por token (`POST /api/v1/gps/update`).
- Control de concurrencia mediante `lock_version` para detectar pedidos tomados simultáneamente por dos conductores.
- Un solo despacho activo por camión.
- Estados `pending`, `accepted`, `in_transit`, `nearby`, `arrived`, `completed` y `cancelled`.
- Transición automática a “cerca” a 500 m y “llegó” a 150 m cuando la ubicación proviene del radar del conductor.
- Ruta, vehículo, conductor y estado visibles en el seguimiento público.
- Métricas operativas por camión y búsqueda de clientes desde el mapa.
- Soporte para ubicación simulada en unidades sin GPS, útil para demostración y pruebas.

La actualización es híbrida: Action Cable transmite por WebSockets los pedidos nuevos, asignaciones y cambios de estado; el GPS se recibe desde el navegador o la API externa y las vistas consultan periódicamente la posición actual de la flota. En producción, Action Cable usa Solid Cable sobre PostgreSQL.

### Flota y conductores

- Vehículos con patente, conductor, bodega base, bodega móvil y estado operativo.
- Token individual para integración GPS.
- Registro y actualización manual del kilometraje, con avisos periódicos para unidades sin GPS.
- Control de revisión técnica, permiso de circulación/SOAP y próxima mantención.
- Alertas por documentos próximos a vencer, kilometraje pendiente y mantenimiento preventivo.
- Datos de licencia y vencimiento para conductores.

### Rendición de rutas y envases

- Rendición diaria por camión.
- Registro de cantidades vendidas, precio aplicado y envases vacíos recuperados.
- Desglose de ingresos por efectivo, tarjeta y transferencia.
- Gastos operacionales asociados a la ruta.
- Al completar la rendición se descuentan productos, ingresan envases y se generan movimientos de stock.
- El dashboard proyecta ventas despachadas aún no rendidas para mostrar una disponibilidad más realista.

### Tesorería, analítica y reportes

- Ingresos originados en ventas locales y rendiciones.
- Egresos con fecha, medio de pago, referencia y documentos asociados.
- Dashboard filtrable por fecha y bodega con ventas locales/de ruta, gastos, medios de pago y tendencias.
- Comparación de stock lleno y vacío, productos críticos y desempeño de camiones.
- Alertas de licencias, cumpleaños y mantenimiento.
- Centro de notificaciones con lectura, eliminación y limpieza automática de registros antiguos.
- Búsqueda global sobre las principales entidades.
- Exportaciones Excel en inventario, ventas, cierres, pedidos, compras y tesorería; documentos PDF para órdenes y transferencias.

## Límites actuales

Para distinguir el producto disponible de su evolución planificada:

- No existe todavía asignación por arrastrar y soltar ni recomendación automática del camión más cercano.
- La ruta se calcula con el servicio público OSRM; no hay optimización de múltiples paradas ni proveedor comercial con SLA.
- La geocodificación usa servicios públicos de OpenStreetMap/Nominatim y requiere acceso a Internet.
- No hay conciliación bancaria automática ni importación de cartolas.
- No hay pronóstico de demanda ni generación automática de órdenes de compra.
- Se registran envases devueltos en ventas y rendiciones, pero aún no existe una cuenta de comodato/saldo de envases por cliente.
- El service worker y los íconos aportan la base web móvil, pero la experiencia PWA instalable y el modo sin conexión siguen en desarrollo.
- No integra emisión tributaria con el SII ni pasarela de pago; los PDF generados son documentos internos.

El detalle de trabajo pendiente está en [ROADMAP.md](ROADMAP.md).

## Arquitectura

StockFlow es un monolito modular: Rails resuelve autenticación, autorización, dominio y persistencia; React renderiza las páginas mediante Inertia sin exigir una API REST separada para la interfaz principal.

| Capa | Tecnología |
| --- | --- |
| Backend | Ruby 4.0.5, Rails 8.1 |
| Frontend | React 19, TypeScript, Inertia.js |
| UI | Tailwind CSS 4, Lucide, Recharts, Framer Motion |
| Mapas | Leaflet, OpenStreetMap, Nominatim y OSRM |
| Build | Vite 8 y SWC |
| Datos | PostgreSQL 15+ y Active Record |
| Tiempo real | Action Cable; Solid Cable en producción |
| Procesos internos | Solid Queue y Solid Cache |
| Archivos/reportes | Active Storage, Prawn y caxlsx |
| Seguridad | Devise, Pundit, Brakeman y bundler-audit |
| Despliegue | Docker, Docker Compose y Kamal |

## Puesta en marcha local

### Requisitos

- Ruby 4.0.5
- Node.js 22 y npm
- PostgreSQL 15 o superior
- Bundler
- Foreman (`gem install foreman`)

La configuración local predeterminada espera:

| Variable | Valor predeterminado |
| --- | --- |
| `POSTGRES_HOST` | `localhost` |
| `POSTGRES_PORT` | `5432` |
| `POSTGRES_USER` | `stockflow` |
| `POSTGRES_PASSWORD` | `stockflowdbpassword` |
| Base de desarrollo | `stock_flow_development` |

Estas credenciales son solo para desarrollo. Puedes crear el rol con:

```bash
sudo -u postgres psql -c "CREATE ROLE stockflow WITH LOGIN CREATEDB PASSWORD 'stockflowdbpassword';"
```

Luego instala y prepara el proyecto:

```bash
bundle install
npm install
gem install foreman
bin/rails db:prepare
bin/rails db:seed
bin/dev
```

La aplicación queda disponible en <http://localhost:3000> y Vite se inicia junto a Rails. Los datos de demostración crean el usuario `admin@stockflow.cl` con contraseña `password123`; cambia estas credenciales fuera de un entorno local.

También puedes usar el instalador idempotente:

```bash
bin/setup
```

## Desarrollo con Docker

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Aplicación: <http://localhost:3000>
- PostgreSQL expuesto en el host: `localhost:5433`
- El contenedor prepara la base e inicia Rails y Vite.

## Producción con Docker

La configuración incluida requiere `config/master.key` y una contraseña explícita para PostgreSQL:

```bash
export POSTGRES_PASSWORD='una-contraseña-segura'
docker compose up --build -d
```

La aplicación queda expuesta en <http://localhost:3000>. Antes de un despliegue real reemplaza el `SECRET_KEY_BASE` de ejemplo de `docker-compose.yml`, protege `config/master.key`, configura HTTPS y revisa volúmenes, copias de seguridad y credenciales. Para una guía operativa más detallada consulta [MANUAL_DE_DESPLIEGUE.md](MANUAL_DE_DESPLIEGUE.md).

## Verificación y calidad

```bash
# Pruebas RSpec
bundle exec rspec

# Tipos y compilación del frontend
npx tsc --noEmit
bin/vite build

# Estilo y análisis de seguridad
bin/rubocop
bin/brakeman
bin/bundler-audit
```

La cobertura existente incluye modelos, servicios de inventario, endpoints del radar y el flujo de pedido público. Como el producto contiene procesos transaccionales y geolocalización, cualquier cambio relevante debería acompañarse con pruebas de servicio/request y una verificación manual de los tres actores: cliente, despacho y conductor.
