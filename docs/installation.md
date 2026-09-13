# Instalación local (SANDBOX)

Requisitos: Node.js 20+, npm, acceso normal a internet (sin las
restricciones del sandbox de chat en el que se construyó este proyecto).

## 1. Backend
```bash
cd 03_backend
cp ../.env.example .env
npm install
npx prisma generate --schema=../02_database/prisma/schema.prisma
npm run seed
npm run dev            # http://localhost:4000
```

## 2. Frontend admin
```bash
cd 04_frontend_admin
cp .env.example .env
npm install
npm run dev             # http://localhost:5173
```

## 3. Tienda para padres
```bash
cd 05_frontend_store
cp .env.example .env
npm install
npm run dev             # http://localhost:5174
```

## Usuarios de prueba (contraseña: `Demo1234!`)
| Correo | Rol |
|---|---|
| admin@tenditalandy.demo | ADMINISTRADOR |
| gestion@tenditalandy.demo | GESTION |
| operador@tenditalandy.demo | OPERADOR |
| padre@tenditalandy.demo | PADRE |

## Verificación rápida
```bash
cd 03_backend
npm run typecheck && npm run typecheck:tests
npm run test               # unitarias
npm run test:integration   # integrales (TEST 01-15 + ESCENARIOS A-E)
```
