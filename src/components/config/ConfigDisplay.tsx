// src/components/config/ConfigDisplay.tsx
import React, { useState, useEffect } from 'react';
import { Server, Link, Database, Video, Package, Monitor, CheckCircle, Copy } from 'lucide-react';
import { getConfigGeneral, type ConfigGeneral } from '../../service/api';

const ConfigDisplay: React.FC = () => {
  const [config, setConfig] = useState<ConfigGeneral | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await getConfigGeneral();
      setConfig(data);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(label);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Error copiando:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg text-center">
        <p className="text-gray-500">No se pudo cargar la configuración</p>
      </div>
    );
  }

  const EndpointCard = ({ icon: Icon, title, url, description }: any) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="text-blue-600" size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <button
          onClick={() => copyToClipboard(url, title)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Copiar URL"
        >
          {copiedUrl === title ? (
            <CheckCircle className="text-green-500" size={18} />
          ) : (
            <Copy className="text-gray-400" size={18} />
          )}
        </button>
      </div>
      <div className="bg-gray-50 rounded p-2">
        <code className="text-xs text-gray-700 break-all">{url}</code>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-lg">
            <Server size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">{config.app_name}</h3>
            <p className="text-sm text-orange-100 mt-1">{config.description}</p>
          </div>
        </div>

        {/* Server Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs text-orange-100">IP del Servidor</p>
            <p className="text-lg font-bold mt-1">{config.server.ip}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs text-orange-100">Puerto</p>
            <p className="text-lg font-bold mt-1">{config.server.port}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs text-orange-100">Versión</p>
            <p className="text-lg font-bold mt-1">v{config.version}</p>
          </div>
        </div>
      </div>

      {/* Endpoints Principales */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <Link className="text-blue-600" size={20} />
          <span>Endpoints Principales</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EndpointCard
            icon={Package}
            title="API Base"
            url={config.endpoints.api_base}
            description="Endpoint raíz de la API"
          />
          <EndpointCard
            icon={Package}
            title="Productos"
            url={config.endpoints.productos}
            description="Consultar productos por código"
          />
          <EndpointCard
            icon={Package}
            title="Nombres de Productos"
            url={config.endpoints.productos_nombre}
            description="Obtener solo nombre del producto"
          />
          <EndpointCard
            icon={Monitor}
            title="Kioscos"
            url={config.endpoints.kioscos}
            description="Gestión de kioscos"
          />
          <EndpointCard
            icon={Database}
            title="Consultas"
            url={config.endpoints.consultas}
            description="Registro y estadísticas"
          />
          <EndpointCard
            icon={Video}
            title="Videos"
            url={config.endpoints.videos}
            description="Gestión de videos"
          />
        </div>
      </div>

      {/* URLs de Recursos */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <Database className="text-green-600" size={20} />
          <span>Recursos Estáticos</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EndpointCard
            icon={Package}
            title="Imágenes"
            url={config.endpoints.imagenes}
            description="Imágenes de productos"
          />
          <EndpointCard
            icon={Video}
            title="Uploads"
            url={config.endpoints.uploads}
            description="Archivos subidos (videos)"
          />
        </div>
      </div>

      {/* Features Habilitadas */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Características Habilitadas</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(config.features).map(([key, value]) => (
            <div
              key={key}
              className={`p-4 rounded-lg border-2 ${
                value ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                {value ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                )}
                <span className={`text-sm font-medium ${value ? 'text-green-700' : 'text-gray-500'}`}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Base URL Card */}
      <div className="bg-linear-to-r from-blue-50 to-green-50 rounded-xl p-6 border-2 border-blue-200">
        <h4 className="font-bold text-gray-800 mb-3">🔗 URL Base para ConfigProvider</h4>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-gray-600 mb-2">
            Usa esta URL en tu Flutter ConfigProvider:
          </p>
          <div className="flex items-center justify-between">
            <code className="text-lg font-mono text-blue-600">
              {config.server.base_url}
            </code>
            <button
              onClick={() => copyToClipboard(config.server.base_url, 'Base URL')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center space-x-2"
            >
              {copiedUrl === 'Base URL' ? (
                <>
                  <CheckCircle size={16} />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigDisplay;