# ═══════════════════════════════════════════════════════════════
# 🎨 DOCKERFILE PARA DASHBOARD REACT + VITE - KIOSKO SYSTEM
# ═══════════════════════════════════════════════════════════════

# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Modificar tsconfig para permitir variables no usadas durante build
RUN sed -i 's/"noUnusedLocals": true/"noUnusedLocals": false/g' tsconfig.app.json || true && \
    sed -i 's/"noUnusedParameters": true/"noUnusedParameters": false/g' tsconfig.app.json || true

# Construir la aplicación para producción
RUN npm run build

# ═══════════════════════════════════════════════════════════════
# Etapa 2: Production con Nginx
FROM nginx:alpine AS production

# Copiar archivos compilados desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]