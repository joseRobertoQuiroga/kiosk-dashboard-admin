import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  AlertCircle,
  Clock,
  Smartphone,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Zap,
  Eye,
  X,
} from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 VISOR DE LICENCIAS
 * ═══════════════════════════════════════════════════════════════
 * 
 * Características:
 * - Visualización de todas las licencias activas
 * - Estado de conexión (heartbeat)
 * - Tiempo restante de licencia
 * - Reactivación de licencias bloqueadas por timeout
 * - Detalles completos del dispositivo
 * - NO permite crear/eliminar licencias (solo visualización)
 */

// ═══════════════════════════════════════════════════════════════
// 📦 TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════

interface License {
  id: string;
  license_key: string;
  license_type: 'trial' | 'monthly' | 'annual' | 'perpetual';
  status: 'active' | 'inactive' | 'expired' | 'revoked' | 'suspended';
  max_activations: number;
  current_activations: number;
  client?: {
    id: string;
    company_name: string;
  };
  branch?: {
    id: string;
    branch_name: string;
  };
  issued_at: string;
  expires_at?: string;
  created_at: string;
}

interface Device {
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

interface LicenseWithDevices extends License {
  devices: Device[];
  minutesSinceLastHeartbeat?: number;
  isTimedOut?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// 🎨 COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const LicensesViewer: React.FC = () => {
  const [licenses, setLicenses] = useState<LicenseWithDevices[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<LicenseWithDevices | null>(null);
  const [reactivating, setReactivating] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // 📥 CARGAR DATOS
  // ═══════════════════════════════════════════════════════════════

  const loadLicenses = async () => {
  try {
    setLoading(true);
    setError(null);

    const API_BASE_URL = 'http://172.20.20.70:3000/api';
    
    // 1. Obtener todas las licencias
    const licensesResponse = await fetch(`${API_BASE_URL}/licenses`);
    if (!licensesResponse.ok) throw new Error('Error obteniendo licencias');
    const licensesData = await licensesResponse.json();

    // 2. Obtener todos los dispositivos
    const devicesResponse = await fetch(`${API_BASE_URL}/licenses/devices/all`);
    if (!devicesResponse.ok) throw new Error('Error obteniendo dispositivos');
    const devicesData = await devicesResponse.json();

    // 🔥 DIAGNÓSTICO: Ver datos crudos
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DATOS RECIBIDOS DEL BACKEND');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Total licencias:', licensesData.count);
    
    if (licensesData.data.length > 0) {
      console.log('Primera licencia (muestra):');
      console.log('  - license_type:', licensesData.data[0].license_type);
      console.log('  - status:', licensesData.data[0].status);
    }

    // 3. 🔥 VALIDAR Y NORMALIZAR DATOS
    const validTypes = ['trial', 'monthly', 'annual', 'perpetual'];
    
    const licensesWithDevices: LicenseWithDevices[] = licensesData.data.map((license: any) => {
      // Normalizar license_type
      const rawType = (license.license_type || '').toLowerCase().trim();
      const normalizedType = validTypes.includes(rawType) ? rawType : 'trial';
      
      // Normalizar status
      const rawStatus = (license.status || '').toLowerCase().trim();
      
      // 🔥 LOG de normalización (solo si hay diferencias)
      if (license.license_type !== normalizedType || license.status !== rawStatus) {
        console.log(`🔧 Normalización en licencia ${license.id}:`);
        console.log(`   Type: "${license.license_type}" → "${normalizedType}"`);
        console.log(`   Status: "${license.status}" → "${rawStatus}"`);
      }

      const licenseDevices = devicesData.data.filter(
        (device: Device) => device.license_id === license.id
      );

      // Calcular tiempo desde último heartbeat
      let minutesSinceLastHeartbeat: number | undefined;
      let isTimedOut = false;

      if (licenseDevices.length > 0 && licenseDevices[0].last_heartbeat) {
        const lastHeartbeat = new Date(licenseDevices[0].last_heartbeat);
        const now = new Date();
        minutesSinceLastHeartbeat = Math.floor(
          (now.getTime() - lastHeartbeat.getTime()) / (1000 * 60)
        );
        isTimedOut = minutesSinceLastHeartbeat > 60;
      }

      return {
        ...license,
        license_type: normalizedType as any, // 🔥 Usar tipo normalizado
        status: rawStatus as any, // 🔥 Usar status normalizado
        devices: licenseDevices,
        minutesSinceLastHeartbeat,
        isTimedOut,
      };
    });

    setLicenses(licensesWithDevices);
    console.log('✅ Licencias procesadas y cargadas:', licensesWithDevices.length);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err: any) {
    console.error('❌ Error cargando licencias:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadLicenses();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadLicenses, 30000);
    return () => clearInterval(interval);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // 🔄 REACTIVAR LICENCIA
  // ═══════════════════════════════════════════════════════════════

  const handleReactivate = async (licenseId: string, deviceId: string) => {
    if (!confirm('¿Reactivar esta licencia? El dispositivo podrá volver a usarla.')) {
      return;
    }

    try {
      setReactivating(licenseId);

      const API_BASE_URL = 'http://192.168.0.78:3000/api';
      
      // Desbloquear dispositivo si está en blacklist
      const response = await fetch(
        `${API_BASE_URL}/licenses/devices/${deviceId}/unblacklist`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) throw new Error('Error reactivando licencia');

      alert('✅ Licencia reactivada exitosamente');
      await loadLicenses();

    } catch (err: any) {
      console.error('❌ Error reactivando:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setReactivating(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🎨 UTILIDADES DE RENDERIZADO
  // ═══════════════════════════════════════════════════════════════

  const getStatusBadge = (license: LicenseWithDevices) => {
  if (license.isTimedOut) {
    return (
      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
        <Clock size={14} />
        <span>Sin Conexión (60+ min)</span>
      </span>
    );
  }

  // 🔥 Normalizar status también
  const normalizedStatus = (license.status || '').toLowerCase().trim();

  if (normalizedStatus === 'active') {
    return (
      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
        <CheckCircle size={14} />
        <span>Activa</span>
      </span>
    );
  }

  if (normalizedStatus === 'expired') {
    return (
      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
        <XCircle size={14} />
        <span>Expirada</span>
      </span>
    );
  }

  if (normalizedStatus === 'revoked') {
    return (
      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
        <ShieldOff size={14} />
        <span>Revocada</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
      <AlertCircle size={14} />
      <span>{license.status || 'Desconocido'}</span>
    </span>
  );
};

  const getTypeBadge = (type: string | undefined) => {
  // 🔥 Normalizar el tipo (convertir a minúsculas y trim)
  const normalizedType = (type || '').toLowerCase().trim();
  
  const types: Record<string, { color: string; label: string }> = {
    trial: { color: 'bg-purple-100 text-purple-700', label: 'Prueba' },
    monthly: { color: 'bg-blue-100 text-blue-700', label: 'Mensual' },
    annual: { color: 'bg-green-100 text-green-700', label: 'Anual' },
    perpetual: { color: 'bg-yellow-100 text-yellow-700', label: 'Perpetua' },
  };

  // 🔥 Manejo robusto de valores inesperados
  const config = types[normalizedType] || { 
    color: 'bg-gray-100 text-gray-700', 
    label: normalizedType || 'Sin Tipo' 
  };

  return (
    <span className={`px-3 py-1 ${config.color} rounded-full text-xs font-medium`}>
      {config.label}
    </span>
  );
};

  const getRemainingTime = (expiresAt?: string) => {
    if (!expiresAt) return 'Sin expiración';

    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs < 0) return 'Expirada';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months} mes${months > 1 ? 'es' : ''}`;
    }

    if (days > 0) {
      return `${days} día${days > 1 ? 's' : ''}`;
    }

    return `${hours} hora${hours > 1 ? 's' : ''}`;
  };

  // ═══════════════════════════════════════════════════════════════
  // 📊 ESTADÍSTICAS
  // ═══════════════════════════════════════════════════════════════

  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'active' && !l.isTimedOut).length,
    timedOut: licenses.filter(l => l.isTimedOut).length,
    expired: licenses.filter(l => l.status === 'expired').length,
    totalDevices: licenses.reduce((sum, l) => sum + l.devices.length, 0),
  };

  // ═══════════════════════════════════════════════════════════════
  // 🎨 RENDERIZADO
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando licencias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-red-600 shrink-0 mt-1" size={24} />
          <div>
            <h4 className="text-lg font-bold text-red-800">Error al Cargar Licencias</h4>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={loadLicenses}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield size={32} />
            <div>
              <h2 className="text-2xl font-bold">Gestión de Licencias</h2>
              <p className="text-purple-100 text-sm mt-1">
                Monitoreo y control de licencias activas
              </p>
            </div>
          </div>
          <button
            onClick={loadLicenses}
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            <RefreshCw size={18} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Total Licencias</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Activas</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Sin Conexión</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.timedOut}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Expiradas</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{stats.expired}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Dispositivos</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalDevices}</p>
        </div>
      </div>

      {/* Alerta de licencias sin conexión */}
      {stats.timedOut > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-yellow-600 shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900">
                ⚠️ {stats.timedOut} licencia{stats.timedOut > 1 ? 's' : ''} sin conexión
              </h4>
              <p className="text-sm text-yellow-800 mt-1">
                Estas licencias no han enviado heartbeat en más de 60 minutos. 
                Pueden estar bloqueadas temporalmente. Puedes reactivarlas si fue un error de conexión.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Licencias */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 bg-gray-50 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            Listado de Licencias
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                  Cliente / Sucursal
                </th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                  Tipo
                </th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                  Estado
                </th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                  Conexión
                </th>
                <th className="text-right py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                  Tiempo Restante
                </th>
                <th className="text-center py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                  Dispositivos
                </th>
                <th className="text-center py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {licenses.map((license) => (
                <tr key={license.id} className="hover:bg-gray-50 transition-colors">
                  {/* Cliente / Sucursal */}
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {license.client?.company_name || 'Sin Cliente'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {license.branch?.branch_name || 'Sin Sucursal'}
                      </p>
                    </div>
                  </td>

                  {/* Tipo */}
                  <td className="py-4 px-6">
                    {getTypeBadge(license.license_type)}
                  </td>

                  {/* Estado */}
                  <td className="py-4 px-6">
                    {getStatusBadge(license)}
                  </td>

                  {/* Conexión */}
                  <td className="py-4 px-6">
                    {license.devices.length > 0 && license.devices[0].last_heartbeat ? (
                      <div className="flex items-center space-x-2">
                        <Activity
                          className={
                            license.isTimedOut
                              ? 'text-red-500'
                              : license.minutesSinceLastHeartbeat! < 10
                              ? 'text-green-500'
                              : 'text-yellow-500'
                          }
                          size={16}
                        />
                        <span className="text-sm text-gray-600">
                          {license.minutesSinceLastHeartbeat! < 1
                            ? 'Ahora'
                            : `${license.minutesSinceLastHeartbeat} min`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Sin activación</span>
                    )}
                  </td>

                  {/* Tiempo Restante */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-800">
                        {getRemainingTime(license.expires_at)}
                      </span>
                    </div>
                  </td>

                  {/* Dispositivos */}
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm font-semibold text-gray-800">
                      {license.current_activations}/{license.max_activations}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setSelectedLicense(license)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>

                      {license.isTimedOut && license.devices.length > 0 && (
                        <button
                          onClick={() => handleReactivate(license.id, license.devices[0].id)}
                          disabled={reactivating === license.id}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition disabled:opacity-50"
                          title="Reactivar licencia"
                        >
                          {reactivating === license.id ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Zap size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {licenses.length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-500 font-medium">No hay licencias registradas</p>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {selectedLicense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="text-purple-600" size={32} />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Detalles de Licencia
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedLicense.client?.company_name}
                    </p>
                  </div>
                </div>
                <button title='bont'
                  onClick={() => setSelectedLicense(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                    Información de Licencia
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium">{getTypeBadge(selectedLicense.license_type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span className="font-medium">{getStatusBadge(selectedLicense)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activaciones:</span>
                      <span className="font-medium">
                        {selectedLicense.current_activations}/{selectedLicense.max_activations}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Emitida:</span>
                      <span className="font-medium">
                        {new Date(selectedLicense.issued_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    {selectedLicense.expires_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expira:</span>
                        <span className="font-medium">
                          {new Date(selectedLicense.expires_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                    Cliente / Sucursal
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Empresa:</span>
                      <span className="font-medium">
                        {selectedLicense.client?.company_name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sucursal:</span>
                      <span className="font-medium">
                        {selectedLicense.branch?.branch_name || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispositivos Activados */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">
                  Dispositivos Activados ({selectedLicense.devices.length})
                </h4>

                {selectedLicense.devices.length > 0 ? (
                  <div className="space-y-3">
                    {selectedLicense.devices.map((device) => (
                      <div
                        key={device.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <Smartphone className="text-gray-400 shrink-0 mt-1" size={20} />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="font-semibold text-gray-800">
                                  {device.device_name || 'Dispositivo sin nombre'}
                                </p>
                                {device.is_blacklisted && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                    Bloqueado
                                  </span>
                                )}
                                {!device.is_active && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                    Inactivo
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-500">Modelo:</span>
                                  <span className="ml-2 text-gray-800">
                                    {device.device_model || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">OS:</span>
                                  <span className="ml-2 text-gray-800">
                                    {device.os_version || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">App:</span>
                                  <span className="ml-2 text-gray-800">
                                    v{device.app_version || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">IP:</span>
                                  <span className="ml-2 text-gray-800 font-mono text-xs">
                                    {device.ip_address || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Activado:</span>
                                  <span className="ml-2 text-gray-800">
                                    {new Date(device.activated_at).toLocaleDateString('es-ES')}
                                  </span>
                                </div>
                                {device.last_heartbeat && (
                                  <div className="col-span-2">
                                    <span className="text-gray-500">Último Heartbeat:</span>
                                    <span className="ml-2 text-gray-800">
                                      {new Date(device.last_heartbeat).toLocaleString('es-ES')}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-500">
                                      (hace {selectedLicense.minutesSinceLastHeartbeat} min)
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Smartphone className="mx-auto text-gray-400 mb-2" size={48} />
                    <p className="text-gray-500">No hay dispositivos activados</p>
                  </div>
                )}
              </div>

              {/* Botón Cerrar */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedLicense(null)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicensesViewer;