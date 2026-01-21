// src/services/api.ts
import axios from 'axios';

// ═══════════════════════════════════════════════════════════════
// 🔧 CONFIGURACIÓN CORREGIDA - Sin /api en la ruta base
// ═══════════════════════════════════════════════════════════════
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ═══════════════════════════════════════════════════════════════
// 📦 TIPOS DE DATOS CORREGIDOS
// ═══════════════════════════════════════════════════════════════

export interface Kiosco {
  id: string;
  nombre: string;
  ubicacion: string;
  activo: boolean;
  fecha_registro: string;
}

export interface Consulta {
  id: number;
  codigo_barra: string;
  id_kiosco: string;
  resultado?: string;
  fecha_hora: string;
}

// 🔥 CORREGIDO: Interface actualizada según el backend
export interface Estadisticas {
  total: number;
  exitosas: number;
  fallidas: number;
  tasa_exito?: string; // Nuevo campo
  topProductos: Array<{ codigo: string; cantidad: number }>;
  // 🔥 CAMBIO CRÍTICO: Ahora es un array con datos completos
  consultasPorKiosco: Array<{
    id: string;
    nombre: string;
    ubicacion: string;
    total_consultas: number;
    exitosas: number;
    fallidas: number;
  }>;
}

export interface EstadisticasKiosco {
  id_kiosco: string;
  total: number;
  exitosas: number;
  fallidas: number;
  topProductos: Array<{ codigo: string; cantidad: number }>;
}

export interface ConsultaPorDia {
  fecha: string;
  cantidad: number;
}
export interface TablaKiosco {
  id: string;
  nombre: string;
  ubicacion: string;
  activo: boolean;
  total_consultas: number;
  consultas_exitosas: number;
  consultas_fallidas: number;
  tasa_exito: string;
}

export interface TablaKioscosResponse {
  total_kioscos: number;
  kioscos_activos: number;
  tabla: TablaKiosco[];
  resumen: {
    total_consultas_sistema: number;
    promedio_consultas_por_kiosco: string;
  };
}
// ═══════════════════════════════════════════════════════════════
// 🌐 FUNCIONES DE API
// ═══════════════════════════════════════════════════════════════

// === KIOSCOS ===
export const getKioscos = async (): Promise<Kiosco[]> => {
  const response = await api.get('/kioscos');
  console.log(response.data,"datos de vonsiltas")
  return response.data;
  
};

export const getKiosco = async (id: string): Promise<Kiosco> => {
  const response = await api.get(`/kioscos/${id}`);
  return response.data;
};

export const createKiosco = async (data: Omit<Kiosco, 'id' | 'fecha_registro'>): Promise<Kiosco> => {
  const response = await api.post('/kioscos', data);
  return response.data;
};

export const updateKiosco = async (
  id: string,
  data: Partial<Omit<Kiosco, 'id' | 'fecha_registro'>>
): Promise<Kiosco> => {
  const response = await api.put(`/kioscos/${id}`, data);
  return response.data;
};

export const deleteKiosco = async (id: string): Promise<void> => {
  await api.delete(`/kioscos/${id}`);
};

// === CONSULTAS ===
export const getConsultas = async (): Promise<Consulta[]> => {
  const response = await api.get('/consultas');
  return response.data;
};

export const getConsultasByKiosco = async (idKiosco: string): Promise<Consulta[]> => {
  const response = await api.get(`/consultas/kiosco/${idKiosco}`);
  return response.data;
};

export const getConsultasByProducto = async (codigo: string): Promise<Consulta[]> => {
  const response = await api.get(`/consultas/producto/${codigo}`);
  return response.data;
};

// === ESTADÍSTICAS ===
export const getEstadisticasGenerales = async (): Promise<Estadisticas> => {
  const response = await api.get('/consultas/estadisticas/general');
  console.log('📊 Estadísticas recibidas:', response.data);
  return response.data;
};

export const getEstadisticasByKiosco = async (idKiosco: string): Promise<EstadisticasKiosco> => {
  const response = await api.get(`/consultas/estadisticas/kiosco/${idKiosco}`);
  return response.data;
};

export const getConsultasByDateRange = async (
  fechaInicio: string,
  fechaFin: string
): Promise<Consulta[]> => {
  const response = await api.get('/consultas/reportes/rango-fechas', {
    params: { fechaInicio, fechaFin },
  });
  return response.data;
};

export const getConsultasByKioscoAndDateRange = async (
  idKiosco: string,
  fechaInicio: string,
  fechaFin: string
): Promise<Consulta[]> => {
  const response = await api.get(`/consultas/reportes/kiosco/${idKiosco}/rango-fechas`, {
    params: { fechaInicio, fechaFin },
  });
  return response.data;
};

export const getConsultasPorDia = async (
  fechaInicio: string,
  fechaFin: string
): Promise<ConsultaPorDia[]> => {
  const response = await api.get('/consultas/reportes/por-dia', {
    params: { fechaInicio, fechaFin },
  });
  return response.data;
};
export const getTablaKioscos = async (): Promise<TablaKioscosResponse> => {
  const response = await api.get('/consultas/reportes/tabla-kioscos');
  console.log('📊 Tabla de kioscos recibida:', response.data);
  return response.data;
};

export const getRendimientoKioscos = async () => {
  const response = await api.get('/consultas/reportes/rendimiento-kioscos');
  console.log('⚡ Rendimiento de kioscos:', response.data);
  return response.data;
};

// === PRODUCTOS ===
export const getProductoByCode = async (codigo: string) => {
  const response = await api.get(`/productos/${codigo}`);
  return response.data;
};

// === TEST API CONNECTION ===
export const testApiConnection = async (url?: string): Promise<boolean> => {
  try {
    const testUrl = url || API_BASE_URL;
    // 🔥 CORREGIDO: Removido /api de la URL de prueba
    const response = await axios.get(`${testUrl}/consultas/estadisticas/general`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('Error en conexión API:', error);
    return false;
  }
};

// AGREGAR AL FINAL DE tu archivo api.ts existente

// ═══════════════════════════════════════════════════════════════
// 🎬 INTERFACES DE VIDEOS (CORREGIDAS)
// ═══════════════════════════════════════════════════════════════

export interface Video {
  id: string;
  titulo: string;  // ✅ CORREGIDO: Backend usa "titulo"
  descripcion?: string | null;
  archivo: string;
  video_url?: string;
  tipo_mime?: string | null;
  tamanio?: number | null;
  duracion?: number | null;
  activo: boolean;
  orden: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface VideoStats {
  total: number;
  activos: number;
  inactivos: number;
  totalSizeMB: string;  // ✅ Backend retorna string con 2 decimales
}

// ═══════════════════════════════════════════════════════════════
// 🎬 FUNCIONES DE API PARA VIDEOS (CORREGIDAS)
// ═══════════════════════════════════════════════════════════════

// Obtener todos los videos
export const getVideos = async (): Promise<Video[]> => {
  const response = await api.get('/videos');
  console.log('📹 Videos obtenidos:', response.data);
  return response.data;
};

// Obtener estadísticas de videos
export const getVideoStats = async (): Promise<VideoStats> => {
  const response = await api.get('/videos/stats/summary');  // ✅ CORREGIDO: Ruta completa
  console.log('📊 Estadísticas de videos:', response.data);
  return response.data;
};

// Subir video
export const uploadVideo = async (
  file: File,
  titulo?: string,  // ✅ CAMBIADO: "nombre" → "titulo"
  descripcion?: string
): Promise<{ success: boolean; video?: Video; error?: string }> => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 SUBIENDO VIDEO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Archivo:', file.name);
    console.log('Tamaño:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Tipo:', file.type);

    // Validar tamaño (100 MB según el backend)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      const error = 'El archivo no debe superar 100 MB';
      console.error('❌', error);
      return { success: false, error };
    }

    // Validar tipo
    const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      const error = 'Solo se permiten archivos de video (MP4, AVI, MOV)';
      console.error('❌', error);
      return { success: false, error };
    }

    const formData = new FormData();
    formData.append('video', file);
    
    // ✅ CORREGIDO: Enviar "titulo" en lugar de "nombre"
    if (titulo) {
      formData.append('titulo', titulo);
    }
    
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    const response = await api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('✅ Video subido exitosamente');
    console.log('ID:', response.data.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return { success: true, video: response.data };
  } catch (error: any) {
    console.error('❌ Error al subir video:', error);
    const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
    return { success: false, error: errorMsg };
  }
};

// Reordenar videos
export const reorderVideos = async (videoIds: string[]): Promise<Video[]> => {
  console.log('🔄 Reordenando videos:', videoIds);
  const response = await api.put('/videos/order', { videoIds });  // ✅ CORREGIDO: Enviar objeto con "videoIds"
  console.log('✅ Videos reordenados');
  return response.data;
};

// Actualizar video (titulo, activo)
export const updateVideo = async (
  id: string,
  data: Partial<Video>
): Promise<Video> => {
  console.log('✏️ Actualizando video:', id, data);
  const response = await api.put(`/videos/${id}`, data);
  console.log('✅ Video actualizado');
  return response.data;
};

// Eliminar video
export const deleteVideo = async (id: string): Promise<void> => {
  console.log('🗑️ Eliminando video:', id);
  await api.delete(`/videos/${id}`);
  console.log('✅ Video eliminado');
};

// Obtener URL de stream
export const getVideoStreamUrl = (id: string): string => {
  return `${API_BASE_URL}/videos/${id}/stream`;  // ✅ Ruta correcta según el backend
};
// AGREGAR AL FINAL DE TU ARCHIVO api.ts EXISTENTE

// ═══════════════════════════════════════════════════════════════
// 🆕 NUEVOS ENDPOINTS - CONFIGURACIÓN Y PRODUCTOS
// ═══════════════════════════════════════════════════════════════

// Interfaces para Config
export interface ConfigEndpoints {
  api_base: string;
  productos: string;
  productos_nombre: string;
  consultas: string;
  videos: string;
  kioscos: string;
  admin: string;
  config: string;
  imagenes: string;
  uploads: string;
  health: string;
}

export interface ConfigGeneral {
  timestamp: string;
  server: {
    ip: string;
    port: number;
    base_url: string;
    environment: string;
  };
  endpoints: ConfigEndpoints;
  features: {
    database_enabled: boolean;
    video_streaming: boolean;
    barcode_scanner: boolean;
    reports: boolean;
    offline_mode: boolean;
  };
  version: string;
  app_name: string;
  description: string;
}

export interface ProductoNombre {
  codigo: string;
  nombre: string;
}

// === CONFIGURACIÓN ===
export const getConfigGeneral = async (): Promise<ConfigGeneral> => {
  const response = await api.get('/config');
  console.log('⚙️ Configuración general:', response.data);
  return response.data;
};

export const getConfigKiosco = async (kioskId: string) => {
  const response = await api.get(`/config/kiosco/${kioskId}`);
  console.log('⚙️ Configuración del kiosco:', response.data);
  return response.data;
};

// === PRODUCTOS - SOLO NOMBRE ===
export const getProductoNombre = async (codigo: string): Promise<ProductoNombre> => {
  try {
    const response = await api.get(`/productos/nombre/${codigo}`);
    return response.data;
  } catch (error) {
    console.warn(`⚠️ Producto no encontrado: ${codigo}`);
    return { codigo, nombre: 'Producto Desconocido' };
  }
};

// === BATCH: Obtener nombres de múltiples productos ===
export const getProductosNombres = async (codigos: string[]): Promise<Map<string, string>> => {
  const nombres = new Map<string, string>();
  
  await Promise.all(
    codigos.map(async (codigo) => {
      const producto = await getProductoNombre(codigo);
      nombres.set(codigo, producto.nombre);
    })
  );
  
  return nombres;
};
// ═══════════════════════════════════════════════════════════════
// 📦 PRODUCTOS - CRUD CON IMÁGENES
// ═══════════════════════════════════════════════════════════════

export interface ProductoCreate {
  codigo: string;
  nombre: string;
  precio: number;
  detalles: string;
  categoria: string;
  promocion?: string | number | '';
}

export interface ProductoComplete extends ProductoCreate {
  imagen: string;
  imagen_url: string;
  promocion?: string;
}

// 🔍 OBTENER TODOS LOS PRODUCTOS
export const getAllProductos = async (): Promise<ProductoComplete[]> => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 [API] GET /productos - Obteniendo productos');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const response = await api.get('/productos');
  
  console.log('✅ Productos obtenidos:', response.data.length);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return response.data;
};

// ➕ CREAR PRODUCTO CON IMAGEN
export const createProducto = async (
  data: ProductoCreate,
  imagen?: File
): Promise<ProductoComplete> => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('➕ [API] POST /productos - Creando producto');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Datos:', data);
  console.log('Tiene imagen:', !!imagen);
  
  // 🔥 CREAR FORMDATA
  const formData = new FormData();
  formData.append('codigo', data.codigo);
  formData.append('nombre', data.nombre);
  formData.append('precio', data.precio.toString());
  formData.append('detalles', data.detalles);
  formData.append('categoria', data.categoria);
  
  if (imagen) {
    console.log('📁 Agregando imagen:', imagen.name);
    console.log('Tamaño:', (imagen.size / 1024).toFixed(2), 'KB');
    formData.append('imagen', imagen);
  }
  
  const response = await api.post('/productos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  console.log('✅ Producto creado:', response.data.codigo);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return response.data;
};

// ✏️ ACTUALIZAR PRODUCTO (CON IMAGEN OPCIONAL)
export const updateProducto = async (
  codigo: string,
  data: Partial<ProductoCreate>,
  imagen?: File
): Promise<ProductoComplete> => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✏️ [API] PUT /productos/${codigo} - Actualizando`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Datos:', data);
  console.log('Nueva imagen:', !!imagen);
  
  // 🔥 CREAR FORMDATA
  const formData = new FormData();
  
  if (data.nombre) formData.append('nombre', data.nombre);
  if (data.precio) formData.append('precio', data.precio.toString());
  if (data.detalles) formData.append('detalles', data.detalles);
  if (data.categoria) formData.append('categoria', data.categoria);
  
  if (imagen) {
    console.log('📁 Agregando nueva imagen:', imagen.name);
    formData.append('imagen', imagen);
  }
  
  const response = await api.put(`/productos/${codigo}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  console.log('✅ Producto actualizado');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return response.data;
};

// 🗑️ ELIMINAR PRODUCTO
export const deleteProducto = async (codigo: string): Promise<void> => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🗑️ [API] DELETE /productos/${codigo}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  await api.delete(`/productos/${codigo}`);
  
  console.log('✅ Producto eliminado');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
};

// ═══════════════════════════════════════════════════════════════
// 🔐 LICENCIAS - API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export interface License {
  id: string;
  license_key: string;
  license_type: 'trial' | 'monthly' | 'annual' | 'perpetual';
  status: 'active' | 'inactive' | 'expired' | 'revoked' | 'suspended';
  max_activations: number;
  current_activations: number;
  client?: { id: string; company_name: string };
  branch?: { id: string; branch_name: string };
  issued_at: string;
  expires_at?: string;
  created_at: string;
}

export interface Device {
  id: string;
  license_id: string;
  device_fingerprint: string;
  device_name?: string;
  device_model?: string;
  os_version?: string;
  app_version?: string;
  ip_address?: string;
  is_active: boolean;
  is_blacklisted: boolean;
  last_heartbeat?: string;
  activated_at: string;
}

export const getAllLicenses = async (): Promise<{ success: boolean; count: number; data: License[] }> => {
  const response = await api.get('/licenses');
  return response.data;
};

export const getAllDevices = async (): Promise<{ success: boolean; count: number; data: Device[] }> => {
  const response = await api.get('/licenses/devices/all');
  return response.data;
};

export const unblacklistDevice = async (deviceId: string): Promise<void> => {
  await api.post(`/licenses/devices/${deviceId}/unblacklist`);
};
// ═══════════════════════════════════════════════════════════════
// 📦 CARGA MASIVA DE PRODUCTOS
// ═══════════════════════════════════════════════════════════════

export interface BulkCreateResult {
  insertados: number;
  errores: number;
  total: number;
  detalles?: Array<{ fila: number; error: string }>;
}

export const bulkCreateProductos = async (
  productos: Array<{
    codigo: string;
    nombre: string;
    precio: number;
    detalles: string;
    categoria: string;
    promocion?: string;
  }>
): Promise<BulkCreateResult> => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 [API] POST /productos/bulk - Carga masiva');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Total productos a crear:', productos.length);

  const response = await api.post('/productos/bulk', productos);

  console.log('✅ Resultado:', response.data);
  console.log(`   ✅ Insertados: ${response.data.insertados}`);
  console.log(`   ❌ Errores: ${response.data.errores}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return response.data;
};
/**
 * 🔥 CARGA MASIVA CON IMÁGENES (ZIP)
 * Sube un archivo ZIP con Excel + imágenes
 */
export const bulkCreateProductosZip = async (file: File): Promise<BulkCreateResult> => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 [API] POST /productos/bulk-zip');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Archivo:', file.name);
  console.log('Tamaño:', (file.size / 1024 / 1024).toFixed(2), 'MB');

  const formData = new FormData();
  formData.append('archivo', file);

  const response = await api.post('/productos/bulk-zip', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  console.log('✅ Resultado:', response.data);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return response.data;
};
export default api;