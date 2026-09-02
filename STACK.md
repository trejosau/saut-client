# SAUT Client: requisitos y comandos

## Runtime fijado

- Node.js LTS 24.20.0 (`.node-version` y `.nvmrc`)
- npm 12.0.2 (`packageManager`)
- Next.js 16.3.4, React 19.2.8 y React DOM 19.2.8
- TypeScript 6.0.3, Tailwind CSS/PostCSS 4.3.3 y Vitest 4.1.11

Use una instalación limpia y reproducible:

```powershell
npm ci
npm run lint
npm run typecheck
npm run test:unit
npm run test:coverage
npm run build
```

Para desarrollo, copie `.env.local.example` a `.env.local`, ajuste los valores
públicos necesarios y ejecute `npm run dev`. No incluya secretos en variables
`NEXT_PUBLIC_*`.

## Compatibilidad aplicada

La configuración de Next 16 conserva los límites de carga de 100 MB que necesita
el flujo de archivos. Es una configuración experimental de Next, no una versión
prerelease del framework, y evita reducir el límite funcional existente.

TypeScript 6.0.3 es la última versión compatible con el rango de
`typescript-eslint` 8.x usado por Next 16.3.4. `typescript-eslint` 8.69.0 y
`@next/eslint-plugin-next` 16.3.4 son compatibles con ESLint 10.9.1. La
configuración flat importa directamente el plugin oficial
de Next y evita `eslint-config-next`, cuyo conjunto de plugins legacy todavía
declara peer dependencies sólo hasta ESLint 9.

Las dependencias de Stripe de navegador se eliminaron: no había importaciones,
configuración ni uso dinámico de ellas. La integración de pagos del cliente se
mantiene mediante los contratos API existentes.

## Automatización

`.github/workflows/ci.yml` ejecuta auditoría de dependencias y la misma secuencia
de calidad bajo Node 24.20.0 y npm 12.0.2 para cada pull request y para `main`.
