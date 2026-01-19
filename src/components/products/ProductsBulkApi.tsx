import React, { useState } from 'react';
import { Cloud, AlertCircle, CheckCircle, Upload, RefreshCw } from 'lucide-react';
import { useBulkApi } from './hooks/useBulkApi';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🌐 COMPONENTE: ProductsBulkApi
 * ═══════════════════════════════════════════════════════════════
 * 
 * Permite importar productos desde APIs externas de forma dinámica
 * 
 * FUNCIONALIDADES:
 * - Configurar URL de API externa
 * - Token de autenticación (opcional)
 * - Especificar path de datos en JSON anidado
 * - Probar conexión y validar estructura
 * - Importar productos
 * 
 * EJEMPLO DE USO:
 * URL: https://api.ejemplo.com/productos
 * Token: (opcional)
 * Path: data.items (si el JSON es { data: { items: [...] } })
 * 
 * ═══════════════════════════════════════════════════════════════
 */

const ProductsBulkApi: React.FC = () => {
  const { loading, preview, error, fullData, testConnection, importFromApi, reset } = useBulkApi();

  // 🔥 ESTADO DEL FORMULARIO
  const [config, setConfig] = useState({
    url: '',
    token: '',
    dataPath: '',
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 🔌 PROBAR CONEXIÓN
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  const handleTestApi = async () => {
    if (!config.url) {
      alert('⚠️ Por favor ingresa la URL de la API');
      return;
    }

    try {
      await testConnection(config);
      console.log('✅ Conexión exitosa');
    } catch (error) {
      // El error ya se maneja en el hook
    }
  };

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 📦 IMPORTAR PRODUCTOS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  const handleImport = async () => {
    if (fullData.length === 0) {
      alert('⚠️ Primero prueba la conexión para cargar los datos');
      return;
    }

    try {
      await importFromApi();
      // Limpiar formulario después de importar
      setConfig({ url: '', token: '', dataPath: '' });
    } catch (error) {
      // El error ya se maneja en el hook
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* HEADER CON INFORMACIÓN */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <Cloud className="text-purple-600 shrink-0 mt-1" size={32} />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              🌐 Importar desde API Externa
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              Conecta a una API externa para importar productos directamente. 
              Ideal para integrar con otros sistemas o bases de datos.
            </p>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm font-medium text-gray-700 mb-2">
                📋 Estructura JSON esperada:
              </p>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`[
  {
    "codigo": "123456",
    "nombre": "Producto Ejemplo",
    "categoria": "Bebidas",
    "precio": 15.50,
    "detalles": "Descripción",
    "promocion": "2x1" // OPCIONAL
  }
]`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FORMULARIO DE CONFIGURACIÓN */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h4 className="text-lg font-bold text-gray-800 mb-4">
          ⚙️ Configuración de API
        </h4>

        <div className="space-y-4">
          {/* URL DE LA API */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL de la API *
            </label>
            <input
              type="url"
              placeholder="https://api.ejemplo.com/productos"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              URL completa del endpoint que retorna los productos
            </p>
          </div>

          {/* TOKEN DE AUTENTICACIÓN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token de Autenticación (Opcional)
            </label>
            <input
              type="text"
              placeholder="Bearer token o API key"
              value={config.token}
              onChange={(e) => setConfig({ ...config, token: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Si la API requiere autenticación, ingresa el token aquí
            </p>
          </div>

          {/* PATH DE DATOS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Path de Datos (Opcional)
            </label>
            <input
              type="text"
              placeholder="data.items"
              value={config.dataPath}
              onChange={(e) => setConfig({ ...config, dataPath: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Si los productos están en un objeto anidado, especifica la ruta (ej: "data.items")
            </p>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleTestApi}
              disabled={loading || !config.url}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Probando...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  <span>Probar Conexión</span>
                </>
              )}
            </button>

            {(preview.length > 0 || error) && (
              <button
                onClick={() => {
                  reset();
                  setConfig({ url: '', token: '', dataPath: '' });
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                <AlertCircle size={16} />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MENSAJE DE ERROR */}
      {/* ═══════════════════════════════════════════════════════ */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-red-600 shrink-0 mt-1" size={24} />
            <div>
              <h4 className="text-lg font-bold text-red-800 mb-2">
                ❌ Error de Conexión
              </h4>
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-3 text-xs text-red-600">
                <p className="font-medium mb-1">Posibles causas:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>URL incorrecta o inaccesible</li>
                  <li>Token de autenticación inválido</li>
                  <li>Path de datos incorrecto</li>
                  <li>Estructura JSON no compatible</li>
                  <li>CORS bloqueado (si aplica)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PREVIEW DE DATOS */}
      {/* ═══════════════════════════════════════════════════════ */}
      {preview.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="text-green-600 shrink-0 mt-1" size={24} />
              <div>
                <h4 className="text-lg font-bold text-green-800">
                  ✅ Conexión Exitosa
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  {fullData.length} producto(s) encontrado(s) y validado(s)
                </p>
              </div>
            </div>
          </div>

          {/* TABLA DE PREVIEW */}
          <div className="bg-white rounded-lg overflow-hidden border border-green-200 mb-4">
            <div className="bg-green-100 px-4 py-2 border-b border-green-200">
              <p className="text-sm font-medium text-green-900">
                Preview (primeros 5 productos)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">#</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Código</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Nombre</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Categoría</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Precio</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Promoción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {preview.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-600">{index + 1}</td>
                      <td className="py-2 px-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {product.codigo}
                        </code>
                      </td>
                      <td className="py-2 px-3 font-medium text-gray-800">{product.nombre}</td>
                      <td className="py-2 px-3">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {product.categoria}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-gray-800">
                        ${product.precio.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600">
                        {product.promocion || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {fullData.length > 5 && (
            <p className="text-xs text-green-700 mb-4">
              ... y {fullData.length - 5} producto(s) más
            </p>
          )}

          {/* BOTÓN: IMPORTAR */}
          <button
            onClick={handleImport}
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
                <span>Importar {fullData.length} Productos</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ESTADO INICIAL */}
      {/* ═══════════════════════════════════════════════════════ */}
      {preview.length === 0 && !error && !loading && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <Cloud className="mx-auto text-gray-400 mb-4" size={64} />
          <h4 className="text-lg font-semibold text-gray-700 mb-2">
            Configura la API y prueba la conexión
          </h4>
          <p className="text-sm text-gray-500">
            Ingresa la URL de tu API externa y haz clic en "Probar Conexión"
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductsBulkApi;