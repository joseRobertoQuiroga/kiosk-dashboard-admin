import { useState } from 'react';
import { bulkCreateProductos } from '../../../service/api';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🌐 HOOK: useBulkApi
 * ═══════════════════════════════════════════════════════════════
 * 
 * Hook para importar productos desde APIs externas
 * 
 * FUNCIONALIDADES:
 * - Probar conexión a API externa
 * - Extraer datos de forma dinámica usando JSON path
 * - Validar estructura de datos
 * - Importar productos al sistema
 * 
 * CONFIGURACIÓN:
 * - url: URL de la API externa
 * - token: Token de autenticación (opcional)
 * - dataPath: Ruta JSON para extraer datos (ej: "data.items")
 * 
 * ESTRUCTURA ESPERADA DEL JSON:
 * [
 *   {
 *     "codigo": "123",
 *     "nombre": "Producto",
 *     "categoria": "Bebidas",
 *     "precio": 10.50,
 *     "detalles": "Descripción",
 *     "promocion": "Oferta" // OPCIONAL
 *   }
 * ]
 * 
 * ═══════════════════════════════════════════════════════════════
 */

interface ApiConfig {
  url: string;
  token?: string;
  dataPath?: string;
}

interface ProductoApi {
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  detalles: string;
  promocion?: string;
}

export const useBulkApi = () => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ProductoApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fullData, setFullData] = useState<ProductoApi[]>([]);

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🔌 PROBAR CONEXIÓN A API EXTERNA
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * Conecta a la API, extrae datos y valida estructura
   */
  const testConnection = async (config: ApiConfig) => {
    setLoading(true);
    setError(null);
    setPreview([]);
    setFullData([]);

    console.group('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔌 [BulkAPI] Probando conexión');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('URL:', config.url);
    console.log('Token:', config.token ? '✓ Presente' : '✗ No configurado');
    console.log('DataPath:', config.dataPath || 'Raíz del JSON');

    try {
      // 🔥 REALIZAR REQUEST
      const headers: any = {};
      if (config.token) {
        headers.Authorization = `Bearer ${config.token}`;
      }

      const response = await fetch(config.url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      console.log('📦 [BulkAPI] Respuesta recibida');

      // 🔥 EXTRAER DATOS USANDO PATH
      const extracted = extractByPath(json, config.dataPath);
      
      if (!extracted || extracted.length === 0) {
        throw new Error('No se encontraron datos en la ruta especificada');
      }

      console.log('✅ [BulkAPI] Datos extraídos:', extracted.length);

      // 🔥 VALIDAR ESTRUCTURA
      const validated = validateApiData(extracted);
      
      if (validated.length === 0) {
        throw new Error('Los datos no tienen la estructura correcta');
      }

      // 🔥 GUARDAR DATOS COMPLETOS Y PREVIEW
      setFullData(validated);
      setPreview(validated.slice(0, 5)); // Primeros 5 para preview
      
      console.log('✅ [BulkAPI] Conexión exitosa');
      console.log('Total productos válidos:', validated.length);
      console.groupEnd();

      return validated;

    } catch (e: any) {
      console.error('❌ [BulkAPI] Error de conexión:', e);
      console.groupEnd();
      
      const errorMsg = e.message || 'No se pudo conectar a la API';
      setError(errorMsg);
      throw e;

    } finally {
      setLoading(false);
    }
  };

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📦 IMPORTAR PRODUCTOS DESDE API
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  const importFromApi = async (data?: ProductoApi[]) => {
    const dataToImport = data || fullData;

    if (!dataToImport || dataToImport.length === 0) {
      alert('⚠️ No hay datos para importar. Primero prueba la conexión.');
      return;
    }

    setLoading(true);
    console.group('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [BulkAPI] Importando productos desde API');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Total a importar:', dataToImport.length);

    try {
      const result = await bulkCreateProductos(dataToImport);

      console.log('✅ [BulkAPI] Importación completa:', result);
      console.groupEnd();

      // 🔥 MOSTRAR RESULTADO
      if (result.errores > 0) {
        let mensaje = `✅ ${result.insertados} productos importados\n`;
        mensaje += `❌ ${result.errores} productos con errores\n\n`;
        
        if (result.detalles && result.detalles.length > 0) {
          mensaje += 'Detalles de errores:\n';
          result.detalles.slice(0, 10).forEach(detalle => {
            mensaje += `  • Fila ${detalle.fila}: ${detalle.error}\n`;
          });
          
          if (result.detalles.length > 10) {
            mensaje += `\n... y ${result.detalles.length - 10} errores más`;
          }
        }
        
        alert(mensaje);
      } else {
        alert(`✅ ¡Éxito! ${result.insertados} productos importados desde la API`);
      }

      // 🔥 LIMPIAR ESTADO
      setPreview([]);
      setFullData([]);

    } catch (e: any) {
      console.error('❌ [BulkAPI] Error importando:', e);
      console.groupEnd();
      
      const errorMsg = e.response?.data?.message || e.message || 'Error desconocido';
      alert(`❌ Error al importar productos:\n${errorMsg}`);

    } finally {
      setLoading(false);
    }
  };

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🔍 EXTRAER DATOS DINÁMICAMENTE POR PATH
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * Permite navegar en JSON anidado usando notación punto
   * Ejemplo: "data.items" accede a obj.data.items
   */
  const extractByPath = (obj: any, path?: string): any[] => {
    if (!path || path.trim() === '') {
      // Sin path: asumir que obj es el array directamente
      return Array.isArray(obj) ? obj : [];
    }

    // Navegar por el path
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        console.warn(`⚠️ [BulkAPI] No se encontró la ruta: ${path}`);
        return [];
      }
    }

    return Array.isArray(current) ? current : [];
  };

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * ✅ VALIDAR Y NORMALIZAR DATOS DE API
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  const validateApiData = (data: any[]): ProductoApi[] => {
    const validados: ProductoApi[] = [];

    console.group('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [BulkAPI] Validando estructura de datos');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    data.forEach((item, index) => {
      try {
        // 🔥 VALIDAR CAMPOS OBLIGATORIOS
        if (!item.codigo || !item.nombre || !item.categoria || !item.detalles) {
          console.warn(`⚠️ [${index}] Campos obligatorios faltantes`);
          return;
        }

        // 🔥 VALIDAR PRECIO
        const precio = Number(item.precio);
        if (isNaN(precio) || precio <= 0) {
          console.warn(`⚠️ [${index}] Precio inválido: ${item.precio}`);
          return;
        }

        // 🔥 NORMALIZAR PRODUCTO
        validados.push({
          codigo: String(item.codigo).trim(),
          nombre: String(item.nombre).trim(),
          categoria: String(item.categoria).trim(),
          precio: precio,
          detalles: String(item.detalles).trim(),
          promocion: item.promocion ? String(item.promocion).trim() : '' // 🔥 OPCIONAL
        });

      } catch (error) {
        console.warn(`⚠️ [${index}] Error procesando item:`, error);
      }
    });

    console.log('Productos válidos:', validados.length);
    console.log('Productos descartados:', data.length - validados.length);
    console.groupEnd();

    return validados;
  };

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🔄 LIMPIAR ESTADO
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  const reset = () => {
    setPreview([]);
    setFullData([]);
    setError(null);
    console.log('🔄 [BulkAPI] Estado limpiado');
  };

  return {
    loading,          // Estado de carga
    preview,          // Preview de primeros 5 productos
    error,            // Mensaje de error
    fullData,         // Datos completos extraídos
    testConnection,   // Función para probar API
    importFromApi,    // Función para importar datos
    reset,            // Función para limpiar estado
  };
};