# MMR Production Control

Sistema de control de producción para MMR Bikes.

## Descripción

Esta aplicación web permite gestionar y monitorizar el proceso de fabricación de bicicletas, controlando los tiempos de cada etapa del proceso:

- Pegatinado
- Corte y cableado
- Montaje
- Embalaje

## Características

- Autenticación de usuarios
- Creación y gestión de órdenes de fabricación
- Control de tiempos por etapa
- Resumen de tiempos totales
- Exportación de datos a Excel
- Interfaz responsive y moderna

## Tecnologías

- React
- TypeScript
- Tailwind CSS
- Supabase (Base de datos y autenticación)
- Vite

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
```

2. Instalar dependencias:
```bash
cd mmr-production-control
npm install
```

3. Crear archivo `.env` con las variables de entorno necesarias:
```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run preview`: Previsualiza la versión de producción
- `npm run lint`: Ejecuta el linter

## Estructura del Proyecto

```
├── src/
│   ├── components/     # Componentes React
│   ├── lib/           # Utilidades y configuración
│   ├── App.tsx        # Componente principal
│   └── main.tsx       # Punto de entrada
├── public/            # Archivos estáticos
└── supabase/         # Migraciones de base de datos
```

## Licencia

Este proyecto es privado y confidencial. Todos los derechos reservados.