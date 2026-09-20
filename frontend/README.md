# Rentar frontend

Frontend de Rentar construido con React, TypeScript, HTML y CSS usando Vite.

## Organización

```text
frontend/
├── src/
│   ├── app/                         # Composición de la aplicación
│   ├── features/
│   │   └── dashboard/               # Pantalla principal y componentes de gestión
│   ├── services/                    # Comunicación con REST y GraphQL
│   ├── styles/                      # Estilos globales
│   └── types/                       # Tipos compartidos del dominio
├── index.html
└── vite.config.ts
```

## Ejecución

Con el backend iniciado en `http://localhost:8080`:

```bash
cd frontend
npm install
npm run dev
```

Vite expone la aplicación en `http://localhost:5173` y redirige `/api` y `/graphql` al backend.
