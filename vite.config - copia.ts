import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    
  ],
    server: {
    port: 3001,        // 🔥 Cambiar puerto
    host: '0.0.0.0',   // Permitir acceso desde red local
    strictPort: false, // Intentar otro puerto si 3001 está ocupado
  }
})