# Sistema de Referidos Multinivel

Sistema web para gestionar redes de referidos con estructura jerárquica multinivel.

## Tecnologías

### Backend
- Laravel 10
- PHP 8.2+
- PostgreSQL (con extensión ltree)
- Laravel Sanctum (autenticación)

### Frontend
- React 22.12.0
- TypeScript
- Vite
- Tailwind CSS
- D3.js (visualización de árbol)

## Estructura del Proyecto

```
referidos/
├── backend/          # API Laravel
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── routes/
│   └── ...
├── frontend/         # Aplicación React
│   ├── src/
│   ├── public/
│   └── ...
└── README.md
```

## Instalación Local

### Requisitos
- PHP 8.2+
- Composer
- Node.js 22.12+
- PostgreSQL 14+

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Variables de Entorno

### Backend (.env)
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=referidos_db
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api
```

## Roles de Usuario

- **Super Admin**: Gestión completa del sistema y líderes
- **Líder**: Puede crear referidos y ver su red
- **Miembro**: Puede crear referidos y ver su red

## Características

- Registro de referidos con código único
- Visualización de árbol jerárquico
- Dashboard con estadísticas
- Exportación a Excel
- Búsqueda avanzada
- Sistema de autenticación
# referidoss
