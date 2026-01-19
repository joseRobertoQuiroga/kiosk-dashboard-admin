import { useState } from 'react';
import * as XLSX from  'xlsx';
import { bulkCreateProductos } from '../../../service/api';

/**
 * ═══════════════════════════════════════════════════════════════
 * 📦 HOOK: useBulkExcel
 * ═══════════════════════════════════════════════════════════════
 * 
 * Hook para carga masiva de productos vía Excel
 * 
 * FUNCIONALIDADES:
 * - Lectura de archivos Excel (.xlsx)
 * - Validación de estructura y datos
 * - Envío masivo al backend
 * - Manejo de errores por fila
 * 
 * COLUMNAS REQUERIDAS EN EXCEL:
 * - codigo (obligatorio)
 * - nombre (obligatorio)
 * - categoria (obligatorio)
 * - precio (obligatorio, > 0)
 * - detalles (obligatorio)
 * - promocion (OPCIONAL)
 * 
 * ═══════════════════════════════════════════════════════════════
 */

interface ProductoExcel {
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  detalles: string;
  promocion?: string; // 🔥 CAMPO OPCIONAL
}

export const useBulkExcel = () => {
  const [rows, setRows] = useState<ProductoExcel[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  /**
   * 🔥 COLUMNAS OBLIGATORIAS EN LA PLANTILLA
   * (promocion NO es obligatoria)
   */
  const REQUIRED_COLUMNS = [
    'codigo',
    'nombre',
    'categoria',
    'precio',
    'detalles',
  ];

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📂 LEER ARCHIVO EXCEL
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * Convierte el archivo Excel a JSON y valida su estructura
   */
  const loadExcelFile = async (file: File) => {
    console.group('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📂 [BulkExcel] Cargando archivo Excel');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Nombre:', file.name);
    console.log('Tamaño:', (file.size / 1024).toFixed(2), 'KB');
    console.groupEnd();

    // 🔥 RESETEAR ESTADO
    setErrors([]);
    setRows([]);

    try {
      // 🔥 LEER ARCHIVO COMO BUFFER
      const data = await file.arrayBuffer();
      
      // 🔥 PARSEAR EXCEL
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      console.log('📊 [BulkExcel] Registros leídos:', json.length);

      // 🔥 VALIDAR DATOS
      validateRows(json as any[]);

    } catch (error: any) {
      console.error('❌ [BulkExcel] Error leyendo archivo:', error);
      setErrors([`Error al leer el archivo: ${error.message}`]);
    }
  };

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * ✅ VALIDAR ESTRUCTURA Y DATOS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * Verifica que el Excel tenga las columnas correctas y datos válidos
   */
  const validateRows = (data: any[]) => {
    const validationErrors: string[] = [];

    console.group('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [BulkExcel] Validando datos');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 🔥 VALIDAR QUE NO ESTÉ VACÍO
    if (!data || data.length === 0) {
      validationErrors.push('❌ El archivo está vacío o no tiene datos');
      setErrors(validationErrors);
      console.groupEnd();
      return;
    }

    // 🔥 VALIDAR COLUMNAS OBLIGATORIAS
    const columns = Object.keys(data[0] || {});
    console.log('Columnas detectadas:', columns);

    REQUIRED_COLUMNS.forEach(col => {
      if (!columns.includes(col)) {
        validationErrors.push(`❌ Columna obligatoria faltante: "${col}"`);
      }
    });

    // Si ya hay errores de estructura, no continuar
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      console.error('❌ Errores de estructura:', validationErrors);
      console.groupEnd();
      return;
    }

    // 🔥 VALIDAR CADA FILA
    const validatedRows: ProductoExcel[] = [];

    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 porque Excel empieza en fila 2 (después del header)

      // VALIDAR CAMPOS OBLIGATORIOS
      if (!row.codigo || String(row.codigo).trim() === '') {
        validationErrors.push(`❌ Fila ${rowNum}: El código es obligatorio`);
      }

      if (!row.nombre || String(row.nombre).trim() === '') {
        validationErrors.push(`❌ Fila ${rowNum}: El nombre es obligatorio`);
      }

      if (!row.categoria || String(row.categoria).trim() === '') {
        validationErrors.push(`❌ Fila ${rowNum}: La categoría es obligatoria`);
      }

      if (!row.detalles || String(row.detalles).trim() === '') {
        validationErrors.push(`❌ Fila ${rowNum}: Los detalles son obligatorios`);
      }

      // VALIDAR PRECIO
      const precio = Number(row.precio);
      if (isNaN(precio) || precio <= 0) {
        validationErrors.push(`❌ Fila ${rowNum}: El precio debe ser un número mayor a 0 (actual: ${row.precio})`);
      }

      // 🔥 SI LA FILA ES VÁLIDA, AGREGARLA
      if (!validationErrors.some(err => err.includes(`Fila ${rowNum}`))) {
        validatedRows.push({
          codigo: String(row.codigo).trim(),
          nombre: String(row.nombre).trim(),
          categoria: String(row.categoria).trim(),
          precio: precio,
          detalles: String(row.detalles).trim(),
          promocion: row.promocion ? String(row.promocion).trim() : '' // 🔥 CAMPO OPCIONAL
        });
      }
    });

    console.log('Filas válidas:', validatedRows.length);
    console.log('Errores encontrados:', validationErrors.length);
    console.groupEnd();

    // 🔥 ACTUALIZAR ESTADO
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setRows([]); // No cargar filas si hay errores
    } else {
      setErrors([]);
      setRows(validatedRows);
      console.log('✅ [BulkExcel] Validación exitosa');
    }
  };

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🚀 ENVIAR PRODUCTOS AL BACKEND
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  const submit = async () => {
    if (!rows || rows.length === 0) {
      alert('⚠️ No hay datos válidos para importar');
      return;
    }

    setLoading(true);
    console.group('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [BulkExcel] Enviando productos al backend');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Total a enviar:', rows.length);

    try {
      const result = await bulkCreateProductos(rows);

      console.log('✅ [BulkExcel] Resultado:', result);
      console.groupEnd();

      // 🔥 MOSTRAR RESULTADO AL USUARIO
      if (result.errores > 0) {
        let mensaje = `✅ ${result.insertados} productos importados correctamente\n`;
        mensaje += `❌ ${result.errores} productos con errores\n\n`;
        
        if (result.detalles && result.detalles.length > 0) {
          mensaje += 'Detalles de errores:\n';
          result.detalles.forEach(detalle => {
            mensaje += `  • Fila ${detalle.fila}: ${detalle.error}\n`;
          });
        }
        
        alert(mensaje);
      } else {
        alert(`✅ ¡Éxito! ${result.insertados} productos importados correctamente`);
      }

      // 🔥 LIMPIAR ESTADO
      reset();

    } catch (error: any) {
      console.error('❌ [BulkExcel] Error en importación', error);
      console.groupEnd();
      
      const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
      alert(`❌ Error al importar productos:\n${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🔄 LIMPIAR ESTADO
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  const reset = () => {
    setRows([]);
    setErrors([]);
    console.log('🔄 [BulkExcel] Estado limpiado');
  };

  return {
    rows,           // Filas validadas listas para enviar
    errors,         // Errores de validación
    loading,        // Estado de carga
    loadExcelFile,  // Función para cargar archivo
    submit,         // Función para enviar datos
    reset,          // Función para limpiar estado
  };
};