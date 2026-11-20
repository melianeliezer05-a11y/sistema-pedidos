# Sistema de pedidos

Carta digital, pedidos, inventario y panel de cocina para un restaurante pequeño. El cliente pide desde el móvil y sigue su pedido en vivo; el personal gestiona pedidos, stock y carta desde `/admin`. También acepta pedidos por voz (webhook de Vapi) e imprime tickets.

## Qué hay

- **Cliente**: carta con personalización (quitar ingredientes, extras), carrito, confirmación y página de seguimiento `/pedido/:id` que se actualiza sola.
- **Admin** (`/admin`): riel lateral, resumen del día (ventas, ticket medio, pedidos por hora, más vendidos), tablero de pedidos con temporizadores (pendiente → preparando → listo → entregado), historial y exportación CSV, cancelación que devuelve el stock exacto, ticket y reimpresión, inventario con ajustes rápidos, carta, movimientos y ajustes. Paleta `Ctrl K`, atajos `1-6`, sonido de pedido nuevo y tema claro/oscuro.
- **Seguridad**: sin contraseñas por defecto, JWT, límite de intentos de login y de pedidos, cabeceras de seguridad y CSP, precios y cantidades validados en servidor, token de Vapi comparado en tiempo constante.

## Stack

Node 22 · Express · better-sqlite3 · React 19 + TypeScript · Vite · Tailwind v4 · shadcn/ui (Base UI) · motion.

## Puesta en marcha

```bash
cp .env.example .env      # rellena JWT_SECRET y ADMIN_PASSWORD
npm install
npm run build             # compila el front en web/dist
npm start                 # http://localhost:3000
```

Desarrollo con recarga: `npm run dev` (API) y `npm run dev:web` (Vite en :5173, proxy a `/api`).

Tests del servidor: `npm test`.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `JWT_SECRET` | Firma de sesiones. **Obligatoria en producción**; en desarrollo es aleatoria. |
| `ADMIN_USERS` | Usuarios admin separados por coma (por defecto `Robert,Monica`). |
| `ADMIN_PASSWORD` | Contraseña inicial de los usuarios que falten. Si está vacía se genera una y se imprime al arrancar. No se resetea en reinicios. |
| `VAPI_WEBHOOK_TOKEN` | Token del webhook de voz. Vacío = webhook desactivado. |
| `DB_PATH` | Ruta de la base SQLite. |
| `PORT`, `NODE_ENV`, `CORS_ORIGIN` | Puerto, modo y origen CORS (apagado por defecto). |
| `PRINTER_MODE`, `PRINTER_INTERFACE` | Impresora de tickets (`none` para desactivar). |

> **Aviso:** el `.env.example` anterior contenía una contraseña real (`barmonica2026`) que sigue en el historial de git. Si se usó en producción, cámbiala.

## API

Público: `GET /api/health`, `GET /api/products`, `GET /api/settings`, `POST /api/orders`, `GET /api/orders/:id/status`, `POST /api/auth/login`.
Admin (Bearer JWT): `GET /api/orders`, `PATCH /api/orders/:id/status`, `GET /api/orders/:id/ticket`, `POST /api/print/:id`, `GET /api/products/admin`, `PATCH /api/products/:id`, `GET /api/ingredients`, `PATCH /api/ingredients/:id/stock`, `PATCH /api/ingredients/:id/threshold`, `GET /api/ingredients/movements`, `PUT /api/settings`.
Voz: `POST /api/vapi/webhook` con el token configurado.

## Estructura

```
server/   config, db, auth, seed, lib/ (pedidos, tickets, rate limit), routes/, test/
web/      src/pages, src/components (+ ui/ y admin/), src/lib
PRODUCT.md · DESIGN.md   identidad y decisiones de diseño
```
