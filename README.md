# Chatea Chevere

Automatiza tu chat de whatsapp. Agiliza procesos. Vende más.

## Comportamiento por entorno

| Entorno         | Variable `DEPLOY_TARGET` | Comportamiento                     |
|-----------------|--------------------------|------------------------------------|
| **Firebase Build** | `firebase`             | Genera export estático             |
| **Vercel Build**   | `vercel`               | Build con funciones serverless     |
| **Desarrollo**     | No definida            | Modo dinámico completo (APIs funcionales) |
| **Runtime Vercel** | `vercel` (automático)  | Ejecuta lógica completa            |

En los scripts del package.json se inyecta automáticamente `DEPLOY_TARGET=firebase` al correr `npm run build:firebase`. En Vercel, se configuró directamente en dashboard `DEPLOY_TARGET=vercel`
