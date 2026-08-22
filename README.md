# StockFlow 🚀

StockFlow es un sistema integral de **ERP y Logística** diseñado para la administración de ventas, inventario y despachos en tiempo real. Construido con tecnología moderna, es altamente responsivo, escalable y cuenta con una arquitectura diseñada tanto para el personal administrativo como para los equipos en ruta.

## 🌟 Características Principales

* **Dashboard de Inteligencia**: Visualiza métricas en tiempo real sobre ventas, operaciones y estado del stock.
* **Portal Público B2B/B2C**: Permite a clientes corporativos e individuales realizar pedidos recurrentes, autogestionar su historial y direcciones, todo esto adaptado móvil.
* **Control Inteligente de Abusos**: Bloqueo automático de clientes abusivos (ej. demasiadas cancelaciones), con desbloqueo manual desde el panel de administración.
* **Gestión Multitienda/Multiempresa**: Un mismo usuario administrador puede gestionar múltiples empresas (RUTs) bajo el mismo techo.
* **Logística y Radar (App de Choferes)**: Pantalla especializada para choferes donde pueden ver, tomar y liquidar pedidos en tiempo real con un solo toque.
* **Control de Inventario**: Administración de múltiples bodegas, listado de productos, listas de precios, compras y proveedores.

## 🛠 Tecnologías Utilizadas

StockFlow es una aplicación "Monolítica Moderna" que usa las siguientes tecnologías:

* **Backend**: Ruby on Rails 8.0
* **Frontend**: React 18 + TypeScript
* **Conexión Frontend/Backend**: Inertia.js (El puente perfecto entre Rails y React, sin necesidad de construir una API separada).
* **Compilación de Assets**: Vite (a través de `vite_ruby`) para una recarga en caliente extremadamente rápida.
* **Estilos y UI**: Tailwind CSS + Componentes interactivos creados a medida.
* **Base de Datos**: PostgreSQL 15+
* **Iconografía**: Lucide React

## 🚀 Guía de Instalación Rápida (Local)

### Pre-requisitos

Asegúrate de tener instalados:

* Ruby 3.x
* PostgreSQL
* Node.js (v18 o superior) y npm

### Configuración de PostgreSQL

La configuración de desarrollo utiliza las siguientes credenciales locales:

* Usuario: `stockflow`
* Contraseña: `stockflowdbpassword`
* Host: `localhost`
* Puerto: `5432`

Estas credenciales son exclusivamente para desarrollo y no deben utilizarse en producción. Crea el usuario antes de preparar la aplicación:

```bash
sudo -u postgres psql -c "CREATE ROLE stockflow WITH LOGIN CREATEDB PASSWORD 'stockflowdbpassword';"
```

Si el usuario ya existe, puedes actualizar su contraseña:

```bash
sudo -u postgres psql -c "ALTER ROLE stockflow WITH LOGIN CREATEDB PASSWORD 'stockflowdbpassword';"
```

Puedes usar otras credenciales definiendo `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER` y `POSTGRES_PASSWORD` en tu entorno.

### Pasos

1. Clona el repositorio e ingresa a la carpeta del proyecto.
2. Instala las dependencias de Ruby y JavaScript:
   ```bash
   bundle install
   npm install
   gem install foreman
   ```
3. Prepara la base de datos:
   ```bash
   bin/rails db:create db:migrate db:seed
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   bin/dev
   ```
   *Esto iniciará tanto el servidor Rails en el puerto 3000 como el servidor de Vite para compilar React en caliente.*

---

## 🐳 Uso con Docker

### Desarrollo

Para trabajar completamente dentro de contenedores, utiliza la configuración de desarrollo:

```bash
docker compose -f docker-compose.dev.yml up --build
```

La base de datos se expone en el puerto `5433` del equipo anfitrión y utiliza las credenciales locales indicadas anteriormente. La aplicación queda disponible en **http://localhost:3000**.

### Producción

Si prefieres no instalar Ruby ni PostgreSQL en tu máquina, hemos incluido una configuración completa de Docker para arrancar la aplicación en modo producción en un solo paso.

Asegúrate de tener **Docker** y **Docker Compose** instalados.

1. Define una contraseña segura para PostgreSQL y construye los contenedores:
   ```bash
   export POSTGRES_PASSWORD='usa-una-contraseña-segura'
   docker compose up --build -d
   ```
2. Espera unos segundos mientras se construye la imagen (esto compilará automáticamente los archivos React y preparará la base de datos).
3. Accede a la aplicación en: **http://localhost:3000**
4. *Opcional*: Si es la primera vez que instalas la aplicación y la base de datos no se ha poblado automáticamente con los datos de prueba, puedes forzar la ejecución del Seed con:
   ```bash
   docker compose exec web bin/rails db:seed
   ```
5. Para detener la aplicación:
   ```bash
   docker compose down
   ```

`POSTGRES_PASSWORD` es obligatoria para esta configuración y no utiliza la contraseña predeterminada de desarrollo.
