import React, { useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useBulkExcel } from './hooks/useBulkExcel';

/**
 * ═══════════════════════════════════════════════════════════════
 * 📦 COMPONENTE: ProductsBulkExcel
 * ═══════════════════════════════════════════════════════════════
 * 
 * Permite la carga masiva de productos desde archivos Excel
 * 
 * FUNCIONALIDADES:
 * - Descargar plantilla Excel con estructura correcta
 * - Cargar archivo Excel con productos
 * - Validar estructura y datos
 * - Mostrar errores de validación
 * - Importar productos al sistema
 * 
 * COLUMNAS REQUERIDAS:
 * - codigo, nombre, categoria, precio, detalles
 * - promocion (OPCIONAL)
 * 
 * ═══════════════════════════════════════════════════════════════
 */

const ProductsBulkExcel: React.FC = () => {
  const { rows, errors, loading, loadExcelFile, submit, reset } = useBulkExcel();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📥 DESCARGAR PLANTILLA EXCEL
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  const downloadTemplate = () => {
    console.log('📥 [BulkExcel] Descargando plantilla...');
    // 🔥 ABRIR ENDPOINT DE TEMPLATE EN NUEVA PESTAÑA
    window.open('http://192.168.0.78:3000/api/productos/template', '_blank');
  };

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📂 MANEJAR SELECCIÓN DE ARCHIVO
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 🔥 VALIDAR EXTENSIÓN
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert('⚠️ Por favor selecciona un archivo Excel (.xlsx o .xls)');
        return;
      }

      loadExcelFile(file);
    }
  };

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🔄 LIMPIAR Y RESETEAR
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  const handleReset = () => {
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* HEADER CON INFORMACIÓN */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <FileSpreadsheet className="text-blue-600 shrink-0 mt-1" size={32} />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              📦 Carga Masiva por Excel
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              Importa múltiples productos de una vez usando un archivo Excel. 
              Descarga la plantilla, complétala con tus datos y súbela aquí.
            </p>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-gray-700 mb-2">
                📋 Columnas requeridas:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>codigo</strong>: Código de barras del producto</li>
                <li>• <strong>nombre</strong>: Nombre del producto</li>
                <li>• <strong>categoria</strong>: Categoría (Bebidas, Snacks, etc.)</li>
                <li>• <strong>precio</strong>: Precio en formato numérico</li>
                <li>• <strong>detalles</strong>: Descripción del producto</li>
                <li>• <strong>promocion</strong>: Promoción vigente (OPCIONAL)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ACCIONES PRINCIPALES */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h4 className="text-lg font-bold text-gray-800 mb-4">
          Paso 1: Prepara tu archivo
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

          {/* BOTÓN: SUBIR ARCHIVO */}
          <label className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium cursor-pointer">
            <Upload size={18} />
            <span>Subir Archivo Excel</span>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
            />
          </label>

          {/* BOTÓN: LIMPIAR */}
          {(rows.length > 0 || errors.length > 0) && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              <X size={18} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ERRORES DE VALIDACIÓN */}
      {/* ═══════════════════════════════════════════════════════ */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-red-600 shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h4 className="text-lg font-bold text-red-800 mb-3">
                ❌ Errores de Validación
              </h4>
              <p className="text-sm text-red-700 mb-3">
                Se encontraron {errors.length} error(es) en el archivo. 
                Por favor corrige estos problemas y vuelve a intentar:
              </p>
              <div className="bg-white rounded-lg p-4 border border-red-200 max-h-64 overflow-y-auto">
                <ul className="space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PREVIEW DE DATOS VÁLIDOS */}
      {/* ═══════════════════════════════════════════════════════ */}
      {rows.length > 0 && errors.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="text-green-600 shrink-0 mt-1" size={24} />
              <div>
                <h4 className="text-lg font-bold text-green-800">
                  ✅ Archivo Validado Correctamente
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  {rows.length} producto(s) listo(s) para importar
                </p>
              </div>
            </div>
          </div>

          {/* TABLA DE PREVIEW */}
          <div className="bg-white rounded-lg overflow-hidden border border-green-200 mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-green-100">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold text-green-900">#</th>
                    <th className="text-left py-2 px-3 font-semibold text-green-900">Código</th>
                    <th className="text-left py-2 px-3 font-semibold text-green-900">Nombre</th>
                    <th className="text-left py-2 px-3 font-semibold text-green-900">Categoría</th>
                    <th className="text-right py-2 px-3 font-semibold text-green-900">Precio</th>
                    <th className="text-left py-2 px-3 font-semibold text-green-900">Promoción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-100">
                  {rows.slice(0, 5).map((row, index) => (
                    <tr key={index} className="hover:bg-green-50">
                      <td className="py-2 px-3 text-gray-600">{index + 1}</td>
                      <td className="py-2 px-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {row.codigo}
                        </code>
                      </td>
                      <td className="py-2 px-3 font-medium text-gray-800">{row.nombre}</td>
                      <td className="py-2 px-3">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {row.categoria}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-gray-800">
                        ${row.precio.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600">
                        {row.promocion || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {rows.length > 5 && (
            <p className="text-xs text-green-700 mb-4">
              ... y {rows.length - 5} producto(s) más
            </p>
          )}

          {/* BOTÓN: IMPORTAR */}
          <button
            onClick={submit}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Importando productos...</span>
              </>
            ) : (
              <>
                <Upload size={20} />
                <span>Importar {rows.length} Productos</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ESTADO INICIAL */}
      {/* ═══════════════════════════════════════════════════════ */}
      {rows.length === 0 && errors.length === 0 && !loading && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <FileSpreadsheet className="mx-auto text-gray-400 mb-4" size={64} />
          <h4 className="text-lg font-semibold text-gray-700 mb-2">
            No hay archivo cargado
          </h4>
          <p className="text-sm text-gray-500">
            Descarga la plantilla, complétala y súbela para comenzar
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductsBulkExcel;