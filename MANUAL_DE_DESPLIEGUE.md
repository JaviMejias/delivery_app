# Manual de Despliegue y Marca Blanca

Este documento explica cómo configurar el sistema para un cliente nuevo (Marca Blanca), arrancar los contenedores de Docker y cargar los datos iniciales.

## 1. Configurar la "Marca Blanca"
El nombre del sistema está completamente parametrizado. No necesitas modificar el código fuente para cambiarlo de "StockFlow" a "Perejo Gas". Se hace directamente mediante una variable de entorno llamada `APP_NAME`.

Para probarlo ahora mismo en modo desarrollo, abre tu terminal y ejecuta:

```bash
# Windows PowerShell
$env:APP_NAME="Perejo Gas"; docker compose -f docker-compose.dev.yml up --build

# Linux / WSL / Mac
APP_NAME="Perejo Gas" docker compose -f docker-compose.dev.yml up --build
```
*Al hacer esto, Docker le pasará el nombre al servidor de Rails y todo (el Login, el Dashboard, la PWA, los Tickets) mostrará "Perejo Gas".*

## 2. Proceso de Instalación para Producción

Cuando vayas a instalar esto en el servidor en la nube de un cliente real, el flujo recomendado es:

1. **Clonar el proyecto** en el servidor.
2. **Definir el archivo `.env`**: Crea un archivo `.env` en la raíz con la configuración del cliente:
   ```env
   APP_NAME="Perejo Gas"
   RAILS_ENV=production
   POSTGRES_USER=usuario
   POSTGRES_PASSWORD=secreto
   ```
3. **Levantar Docker**: Inicias los contenedores en modo desatendido (Background):
   ```bash
   docker compose up -d --build
   ```
4. **Ejecutar Migraciones y Semillas (Seed)**: El sistema necesita la estructura de base de datos inicial.
   ```bash
   docker compose exec web bin/rails db:prepare
   docker compose exec web bin/rails db:seed
   ```
   *(El `db:seed` es el que crea el usuario Administrador por defecto y las configuraciones base).*

## 3. Consideraciones del Logotipo

Actualmente, el sistema usa texto dinámico o un ícono genérico ("SF"). En una próxima actualización, podremos agregar la variable `APP_LOGO_URL="https://misitio.com/logo.png"` para que reemplace también el logo gráfico en la boleta y el menú.

## 4. Finalizando el modo de prueba
Para apagar tu entorno de pruebas actual en Docker, simplemente presiona `Ctrl+C` en la consola donde está corriendo, y si quieres estar seguro de que bajó todo:
```bash
docker compose -f docker-compose.dev.yml down
```
