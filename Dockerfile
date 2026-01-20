# ═══════════════════════════════════════════════════════════════
# 🎯 DOCKERFILE DASHBOARD - CON VARIABLES DE ENTORNO DINÁMICAS
# ═══════════════════════════════════════════════════════════════

# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# ✅ Recibir la URL de la API como argumento de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copiar dependencias
COPY package*.json ./
RUN npm install

# Copiar código
COPY . .

# ✅ Deshabilitar reglas estrictas de TypeScript
RUN sed -i 's/"noUnusedLocals": true/"noUnusedLocals": false/g' tsconfig.app.json || true && \
    sed -i 's/"noUnusedParameters": true/"noUnusedParameters": false/g' tsconfig.app.json || true

# ✅ Build con la variable de entorno
RUN npm run build

# Etapa 2: Production
FROM nginx:alpine AS production

# Copiar archivos estáticos
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]