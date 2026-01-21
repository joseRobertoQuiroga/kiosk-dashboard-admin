import React, { useState, useRef } from 'react';
import { Upload, Download, FileArchive, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { bulkCreateProductosZip } from '../../service/api';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/**
 * ═══════════════════════════════════════════════════════════════
 * 📦 COMPONENTE: ProductsBulkZip
 * ═══════════════════════════════════════════════════════════════
 * 
 * Carga masiva de productos CON IMÁGENES usando archivo ZIP
 * 
 * ESTRUCTURA DEL ZIP:
 * ├── productos.xlsx
 * └── imagenes/
 *     ├── 1234567890.jpg
 *     ├── 9876543210.png
 *     └── ...
 * 
 * ═══════════════════════════════════════════════════════════════
 */

interface BulkResult {
  insertados: number;
  errores: number;
  total: number;
  detalles?: Array<{ fila: number; error: string }>;
}

const ProductsBulkZip: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📥 DESCARGAR PLANTILLA
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  const downloadTemplate = () => {
    console.log('📥 Descargando plantilla Excel...');
    window.open(`${API_BASE_URL}/productos/template`, '_blank');
  };

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📂 MANEJAR SELECCIÓN DE ARCHIVO ZIP
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // VALIDAR EXTENSIÓN
    if (!file.name.endsWith('.zip')) {
      alert('⚠️ Por favor selecciona un archivo ZIP');
      return;
    }

    // VALIDAR TAMAÑO (50 MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('⚠️ El archivo ZIP no debe superar 50 MB');
      return;
    }

    await uploadZip(file);
  };

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🚀 SUBIR Y PROCESAR ZIP
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  const uploadZip = async (file: File) => {
  setLoading(true);
  setError(null);
  setResult(null);

  console.log('📦 [BulkZip] Subiendo archivo ZIP');
  console.log('Nombre:', file.name);
  console.log('Tamaño:', (file.size / 1024 / 1024).toFixed(2), 'MB');

  try {
    const resultado = await bulkCreateProductosZip(file);

    console.log('✅ [BulkZip] Resultado:', resultado);
    setResult(resultado);

    // 🔥 MOSTRAR NOTIFICACIÓN MEJORADA
    if (resultado.errores > 0) {
      let mensaje = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      mensaje += `📊 RESULTADO DE IMPORTACIÓN\n`;
      mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      mensaje += `✅ Productos importados: ${resultado.insertados}\n`;
      mensaje += `❌ Productos con errores: ${resultado.errores}\n`;
      mensaje += `📦 Total procesados: ${resultado.total}\n\n`;
      
      if (resultado.detalles && resultado.detalles.length > 0) {
        mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        mensaje += `DETALLES DE ERRORES:\n`;
        mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        resultado.detalles.slice(0, 10).forEach((detalle, index) => {
          mensaje += `${index + 1}. FILA ${detalle.fila}`;
          if ((detalle as any).codigo) {
            mensaje += ` - Código: ${(detalle as any).codigo}`;
          }
          mensaje += `\n   ❌ ${detalle.error}\n\n`;
        });
        
        if (resultado.detalles.length > 10) {
          mensaje += `\n... y ${resultado.detalles.length - 10} errores más\n`;
        }

        mensaje += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        mensaje += `💡 RECOMENDACIONES:\n`;
        mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        mensaje += `• Revisa que los códigos sean SOLO números\n`;
        mensaje += `• Verifica que las imágenes estén en carpeta "imagenes/"\n`;
        mensaje += `• Asegúrate de que no haya códigos duplicados\n`;
        mensaje += `• Valida que todos los campos obligatorios estén completos\n`;
      }
      
      alert(mensaje);
    } else {
      alert(
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `✅ ¡IMPORTACIÓN EXITOSA!\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${resultado.insertados} productos importados correctamente\n` +
        `con sus respectivas imágenes.\n\n` +
        `Los productos ya están disponibles en el sistema.`
      );
    }

  } catch (err: any) {
    console.error('❌ [BulkZip] Error:', err);
    
    const errorMsg = err.response?.data?.message || err.message || 'Error desconocido';
    setError(errorMsg);
    
    alert(
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `❌ ERROR AL PROCESAR ZIP\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${errorMsg}\n\n` +
      `Causas comunes:\n` +
      `• El ZIP no contiene "productos.xlsx"\n` +
      `• El Excel tiene formato incorrecto\n` +
      `• Faltan columnas obligatorias\n` +
      `• El archivo supera 50 MB`
    );

  } finally {
    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
};

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🔄 LIMPIAR RESULTADO
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  const handleReset = () => {
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* HEADER CON INFORMACIÓN */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <FileArchive className="text-indigo-600 shrink-0 mt-1" size={32} />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              🖼️ Carga Masiva con Imágenes (ZIP)
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              Importa múltiples productos con sus imágenes en un solo paso. 
              Sube un archivo ZIP que contenga el Excel con los datos y las imágenes correspondientes.
            </p>
            
            {/* INSTRUCCIONES */}
            <div className="bg-white rounded-lg p-4 border border-indigo-200 space-y-3">
              <p className="text-sm font-medium text-gray-700">
                📋 Cómo preparar tu archivo ZIP:
              </p>
              
              <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
                <li>Descarga la plantilla Excel y complétala con tus productos</li>
                <li>Crea una carpeta llamada <code className="bg-gray-100 px-2 py-0.5 rounded">imagenes/</code></li>
                <li>Coloca las imágenes dentro de la carpeta (formatos: JPG, PNG, WEBP, GIF)</li>
                <li>
                  Nombra cada imagen con el <strong>código del producto</strong>:
                  <div className="mt-1 ml-4 text-xs text-gray-500">
                    • Ejemplo: <code className="bg-gray-100 px-2 py-0.5 rounded">1234567890.jpg</code><br/>
                    • O especifica el nombre en la columna "imagen" del Excel
                  </div>
                </li>
                <li>Comprime todo en un archivo ZIP (máximo 50 MB)</li>
              </ol>

              <div className="mt-3 pt-3 border-t border-indigo-100">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  📁 Estructura del ZIP:
                </p>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`productos-masivos.zip
├── productos.xlsx
└── imagenes/
    ├── 1234567890.jpg
    ├── 9876543210.png
    └── ...`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ACCIONES */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h4 className="text-lg font-bold text-gray-800 mb-4">
          Paso 1: Prepara tu archivo ZIP
        </h4>

        <div className="flex flex-wrap gap-3">
          {/* BOTÓN: DESCARGAR PLANTILLA */}
          <button
            onClick={downloadTemplate}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
          >
            <Download size={18} />
            <span>Descargar Plantilla Excel</span>
          </button>

          {/* BOTÓN: SUBIR ZIP */}
          <label className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition font-medium cursor-pointer">
            <Upload size={18} />
            <span>Subir Archivo ZIP</span>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".zip"
              onChange={handleFileChange}
              disabled={loading}
            />
          </label>

          {/* BOTÓN: LIMPIAR */}
          {(result || error) && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              <AlertCircle size={18} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* LOADING */}
      {/* ═══════════════════════════════════════════════════════ */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <h4 className="text-lg font-bold text-blue-800">
                Procesando archivo ZIP...
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Extrayendo datos y guardando imágenes. Por favor espera...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ERROR */}
      {/* ═══════════════════════════════════════════════════════ */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-red-600 shrink-0 mt-1" size={24} />
            <div>
              <h4 className="text-lg font-bold text-red-800 mb-2">
                ❌ Error al Procesar ZIP
              </h4>
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-3 text-xs text-red-600">
                <p className="font-medium mb-1">Posibles causas:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>El archivo no contiene productos.xlsx</li>
                  <li>El Excel tiene formato incorrecto</li>
                  <li>Faltan columnas obligatorias</li>
                  <li>El archivo supera 50 MB</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* RESULTADO EXITOSO */}
      {/* ═══════════════════════════════════════════════════════ */}
      {result && !loading && (
        <div className={`border rounded-xl p-6 ${
          result.errores > 0 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-start space-x-3 mb-4">
            {result.errores > 0 ? (
              <AlertCircle className="text-yellow-600 shrink-0 mt-1" size={24} />
            ) : (
              <CheckCircle className="text-green-600 shrink-0 mt-1" size={24} />
            )}
            <div>
              <h4 className={`text-lg font-bold ${
                result.errores > 0 ? 'text-yellow-800' : 'text-green-800'
              }`}>
                {result.errores > 0 ? '⚠️ Importación con Advertencias' : '✅ Importación Exitosa'}
              </h4>
              <p className={`text-sm mt-1 ${
                result.errores > 0 ? 'text-yellow-700' : 'text-green-700'
              }`}>
                Procesamiento completado
              </p>
            </div>
          </div>

          {/* ESTADÍSTICAS */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
              <p className="text-xs text-gray-600">Total Procesados</p>
              <p className="text-2xl font-bold text-gray-800">{result.total}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-2 border-green-200">
              <p className="text-xs text-gray-600">Insertados</p>
              <p className="text-2xl font-bold text-green-600">{result.insertados}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-2 border-red-200">
              <p className="text-xs text-gray-600">Errores</p>
              <p className="text-2xl font-bold text-red-600">{result.errores}</p>
            </div>
          </div>

          {/* DETALLES DE ERRORES */}
          {result.detalles && result.detalles.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-yellow-200">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Detalles de errores:
              </p>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {result.detalles.map((detalle, index) => (
                  <li key={index} className="text-xs text-red-700">
                    • Fila {detalle.fila}: {detalle.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ESTADO INICIAL */}
      {/* ═══════════════════════════════════════════════════════ */}
      {!result && !error && !loading && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <FileArchive className="mx-auto text-gray-400 mb-4" size={64} />
          <h4 className="text-lg font-semibold text-gray-700 mb-2">
            No hay archivo cargado
          </h4>
          <p className="text-sm text-gray-500 mb-4">
            Descarga la plantilla, prepara tu archivo ZIP y súbelo aquí
          </p>
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
            <ImageIcon size={16} />
            <span>Soporta múltiples imágenes en formato JPG, PNG, WEBP, GIF</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsBulkZip;