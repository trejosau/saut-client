# SAUT Client

Frontend principal de SAUT.

Esta app en `Next.js 16` concentra dos experiencias:

- Tienda publica para clientes.
- Dashboard interno para admin, operaciones, soporte y diseno.

## Stack

- `Next.js`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- Integracion con Stripe Checkout

## Modulos principales

### Publico

- `/`
- `/catalogo`
- `/producto/[slug]`
- `/colecciones`
- `/colecciones/[slug]`
- `/drops`
- `/drops/[slug]`
- `/personalizar`
- `/checkout`
- `/mis-ordenes`
- `/contacto`
- `/sobre-nosotros`

### Dashboard

- `/dashboard`
- `/dashboard/catalogo`
- `/dashboard/inventario`
- `/dashboard/pedidos`
- `/dashboard/envios`
- `/dashboard/soporte`
- `/dashboard/analitica`
- `/dashboard/permisos-auditoria`

## Cómo se conecta

- HTTP contra la API modular NestJS/Fastify de SAUT.
- WebSocket contra la misma API para el mapa de ventas en tiempo real.
- Cookies HTTP-only mediante el BFF de Next.js para autenticación y dashboard.

Variables usadas con mas frecuencia:

- `NEXT_PUBLIC_API_BASE_URL`
- `INTERNAL_API_BASE_URL`
- `NEXT_PUBLIC_ANALYTICS_WS_URL`

## Estructura

- `app/(public)`: rutas de ecommerce.
- `app/dashboard`: rutas del panel interno.
- `modules/commerce`: cliente HTTP y UI compartida del flujo de compra.
- `modules/customizer`: editor y utilidades del personalizador.
- `modules/dashboard`: APIs server-side y UI del dashboard.
- `modules/auth`: cookies, sesion y helpers de acceso.

## Desarrollo local

```bash
npm install
npm run dev
```

Por defecto corre en `http://localhost:4200`.

## Calidad

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:coverage
npm run build
```

Las pruebas usan Vitest, Testing Library y jsdom. Los estilos globales, tokens
semánticos y estados accesibles viven en `app/globals.css` y
`core/design-system`.

## Flujo Git

- `main`: estado estable.
- `develop`: integración.
- `feature/*`, `test/*`, `fix/*`, `refactor/*` y `chore/*`: trabajo aislado.
- Las ramas se fusionan con `--no-ff`; no se usa force push.

## Nota de estado

El frontend ya consume la arquitectura real del monorepo:

- `auth` maneja sesion, roles, permisos y auditoria.
- `orders` maneja pedidos, work orders y merma.
- `analytics_map` entrega KPIs y mapa en tiempo real.
- `pricing` ya esta activo por API, aunque todavia no existe una pantalla dedicada de pricing en dashboard.
