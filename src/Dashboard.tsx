import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Monitor,
  TrendingUp,
  Activity,
  Wifi,
  WifiOff,
  Settings,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Video,
   FileText,
   Shield,
   Package
} from 'lucide-react';
import './chartConfig';
import VideoManager from './VideoManager'; 
import {
  getKioscos,
  getEstadisticasGenerales,
  getTablaKioscos,        // AGREGAR
  getRendimientoKioscos, 
    createKiosco,    // 🔥 NUEVO
  updateKiosco,    // 🔥 NUEVO
  deleteKiosco, 
  getProductosNombres,
  type Kiosco,
  type Estadisticas,
} from './service/api';
import ReporteTopProductos from './components/reports/ReporteTopProductos';
import ReporteConsultasKiosco from './components/reports/ReporteConsultasKiosco';
import ReporteMixto from './components/reports/ReporteMixto';
import ConfigDisplay from './components/config/ConfigDisplay';
import ProductsTabs from './components/products/producTabs';
import LicensesViewer  from '../src/components/license/license_Wierwer';
type TabType = 'overview' | 'kiosks' |'reports' | 'products'| 'video' | 'config'| 'licenses';

const Dashboard: React.FC = () => {
  
  const [activeReport, setActiveReport] = useState<'productos' | 'kioscos' | 'mixto'>('productos');
const [productosConNombres, setProductosConNombres] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dashboardData, setDashboardData] = useState<Estadisticas | null>(null);
  const [kioscos, setKioscos] = useState<Kiosco[]>([]);
  const [selectedKiosk, setSelectedKiosk] = useState<Kiosco | null>(null);
  const [tablaKioscos, setTablaKioscos] = useState<any>(null); // AGREGAR
  const [rendimientoKioscos, setRendimientoKioscos] = useState<any>(null); // AGREGAR
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiConfig, setApiConfig] = useState({
    url: 'http://172.20.20.70:3000/api',
    status: 'checking' as 'checking' | 'connected' | 'disconnected',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
const [editingKiosco, setEditingKiosco] = useState<Kiosco | null>(null);
const [formSubmitting, setFormSubmitting] = useState(false);
const [formData, setFormData] = useState({
  nombre: '',
  ubicacion: '',
  activo: true,
});

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, []);
const loadAllData = async () => {
  try {
    setLoading(true);
    setError(null);

    const [stats, kioscosData, tablaData, rendimientoData] = await Promise.all([
      getEstadisticasGenerales(),
      getKioscos(),
      getTablaKioscos(),
      getRendimientoKioscos(),
    ]);

    setDashboardData(stats);
    setKioscos(kioscosData);
    setTablaKioscos(tablaData);
    setRendimientoKioscos(rendimientoData);

    // 🆕 NUEVO: Obtener nombres de productos
    if (stats.topProductos && stats.topProductos.length > 0) {
      const codigos = stats.topProductos.map(p => p.codigo);
      const nombresMap = await getProductosNombres(codigos);
      
      const productosConNombresTemp = stats.topProductos.map((p, index) => ({
        posicion: index + 1,
        codigo: p.codigo,
        nombre: nombresMap.get(p.codigo) || 'Desconocido',
        cantidad: p.cantidad,
      }));
      
      setProductosConNombres(productosConNombresTemp);
    }

    setApiConfig((prev) => ({ ...prev, status: 'connected' }));
    
    console.log('✅ Datos cargados');
  } catch (err) {
    console.error('Error cargando datos:', err);
    setError('Error conectando con la API');
    setApiConfig((prev) => ({ ...prev, status: 'disconnected' }));
  } finally {
    setLoading(false);
  }
};
const handleEditKiosco = (kiosco: any) => {
  setEditingKiosco(kiosco);
  setFormData({
    nombre: kiosco.nombre,
    ubicacion: kiosco.ubicacion,
    activo: kiosco.activo,
  });
  setShowCreateModal(true);
};

const handleDeleteKiosco = async (id: string, nombre: string) => {
  if (!window.confirm(`¿Estás seguro de eliminar el kiosco "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
    return;
  }

  try {
    await deleteKiosco(id);
    
    // Mostrar notificación de éxito
    alert(`✅ Kiosco "${nombre}" eliminado exitosamente`);
    
    // Recargar datos
    await loadAllData();
  } catch (error) {
    console.error('Error eliminando kiosco:', error);
    alert('❌ Error al eliminar el kiosco. Por favor intenta de nuevo.');
  }
};

const handleSubmitKiosco = async (e: React.FormEvent) => {
  e.preventDefault();
  setFormSubmitting(true);

  try {
    if (editingKiosco) {
      // Actualizar kiosco existente
      await updateKiosco(editingKiosco.id, formData);
      alert(`✅ Kiosco "${formData.nombre}" actualizado exitosamente`);
    } else {
      // Crear nuevo kiosco
      await createKiosco(formData);
      alert(`✅ Kiosco "${formData.nombre}" creado exitosamente`);
    }

    // Cerrar modal y limpiar formulario
    setShowCreateModal(false);
    setEditingKiosco(null);
    setFormData({ nombre: '', ubicacion: '', activo: true });

    // Recargar datos
    await loadAllData();
  } catch (error) {
    console.error('Error guardando kiosco:', error);
    alert('❌ Error al guardar el kiosco. Por favor intenta de nuevo.');
  } finally {
    setFormSubmitting(false);
  }
};
  

  

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-red-50 to-orange-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error de Conexión</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAllData}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const productosChartData = {
  labels: productosConNombres.map((p) => p.nombre) || [],
  datasets: [
    {
      label: 'Consultas',
      data: productosConNombres.map((p) => p.cantidad) || [],
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
    },
  ],
};

  const kioscosChartData = {
  labels: dashboardData?.consultasPorKiosco?.map((k) => k.nombre) || [],
  datasets: [
    {
      label: 'Consultas',
      data: dashboardData?.consultasPorKiosco?.map((k) => k.total_consultas) || [],
      backgroundColor: 'rgba(34, 197, 94, 0.7)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 2,
      fill: true,
    },
  ],
};

  return (
    <div className="flex h-screen bg-linear-to-br from-blue-50 to-green-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-xl">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-green-600">
            KioskAdmin
          </h1>
          <p className="text-sm text-gray-500 mt-1">Panel de Control</p>

          {/* API Status */}
          <div className="mt-4 flex items-center space-x-2">
            {apiConfig.status === 'connected' ? (
              <>
                <Wifi className="text-green-500" size={16} />
                <span className="text-xs text-green-600 font-medium">API Conectada</span>
              </>
            ) : (
              <>
                <WifiOff className="text-red-500" size={16} />
                <span className="text-xs text-red-600 font-medium">API Desconectada</span>
              </>
            )}
          </div>
        </div>

        <nav className="p-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all ${
              activeTab === 'overview'
                ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 size={20} />
            <span className="font-medium">Estadísticas</span>
          </button>

          <button
            onClick={() => setActiveTab('kiosks')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all ${
              activeTab === 'kiosks'
                ? 'bg-linear-to-r from-green-500 to-green-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Monitor size={20} />
            <span className="font-medium">Kioscos</span>
          </button>

          <button
  onClick={() => setActiveTab('products')}
  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all ${
    activeTab === 'products'
      ? 'bg-linear-to-r from-purple-500 to-purple-600 text-white shadow-lg'
      : 'text-gray-600 hover:bg-gray-100'
  }`}
>
  <Package size={20} />
  <span className="font-medium">Productos</span>
</button>
<button
  onClick={() => setActiveTab('licenses')}
  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all ${
    activeTab === 'licenses'
      ? 'bg-linear-to-r from-purple-500 to-purple-600 text-white shadow-lg'
      : 'text-gray-600 hover:bg-gray-100'
  }`}
>
  <Shield size={20} />
  <span className="font-medium">Licencias</span>
</button>
          <button
  onClick={() => setActiveTab('reports')}
  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all ${
    activeTab === 'reports'
      ? 'bg-linear-to-r from-indigo-500 to-indigo-600 text-white shadow-lg'
      : 'text-gray-600 hover:bg-gray-100'
  }`}
>
  <FileText size={20} />
  <span className="font-medium">Reportes</span>
</button>

          <button
            onClick={() => setActiveTab('video')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all ${
              activeTab === 'video'
                ? 'bg-linear-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Video size={20} />
            <span className="font-medium">Video</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'config'
                ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings size={20} />
            <span className="font-medium">Configuración</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
  {activeTab === 'overview' && 'Estadísticas Generales'}
  {activeTab === 'kiosks' && 'Gestión de Kioscos'}
  {activeTab === 'reports' && 'Informes y Reportes'}
  {activeTab === 'video' && 'Video Publicitario'}
  {activeTab === 'config' && 'Configuración'}
  {activeTab === 'products' && 'Gestión de Productos'}
  {activeTab === 'licenses' && <LicensesViewer />}


</h2>
              <p className="text-gray-500 mt-1">
                Última actualización: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={loadAllData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <RefreshCw size={16} />
              <span>Actualizar</span>
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && dashboardData && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Consultas Totales</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {dashboardData.total?.toLocaleString() || 0}
                      </p>
                    </div>
                    <TrendingUp className="text-blue-500" size={24} />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Exitosas</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {dashboardData.exitosas || 0}
                      </p>
                    </div>
                    <CheckCircle className="text-green-500" size={24} />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Fallidas</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {dashboardData.fallidas || 0}
                      </p>
                    </div>
                    <AlertCircle className="text-red-500" size={24} />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Kioscos Activos</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {kioscos.filter((k) => k.activo).length}/{kioscos.length}
                      </p>
                    </div>
                    <Activity className="text-purple-500" size={24} />
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top Productos */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Top Productos Consultados
                  </h3>
                  {dashboardData.topProductos && dashboardData.topProductos.length > 0 ? (
                    <div className="h-64">
                     <Bar
  data={productosChartData}
  options={{
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1
        }
      },
      x: {
        ticks: {
          maxRotation: 90,  // 🔥 VERTICAL
          minRotation: 90,  // 🔥 VERTICAL
          font: {
            size: 11
          }
        }
      }
    }
  }}
/>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
                  )}
                </div>

              {/* Consultas por Kiosco */}
<div className="bg-white rounded-xl p-6 shadow-lg">
  <h3 className="text-lg font-bold text-gray-800 mb-4">
    Consultas por Kiosco
  </h3>
  {dashboardData?.consultasPorKiosco && dashboardData.consultasPorKiosco.length > 0 ? (
    <div className="h-64">
      <Line
        data={kioscosChartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const kiosco = dashboardData.consultasPorKiosco[context.dataIndex];
                  return [
                    `Total: ${kiosco.total_consultas}`,
                    `Exitosas: ${kiosco.exitosas}`,
                    `Fallidas: ${kiosco.fallidas}`,
                  ];
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                stepSize: 1,
              },
            },
          },
        }}
      />
    </div>
  )  :(
    <div className="text-center py-8">
      <AlertCircle className="mx-auto text-gray-400 mb-2" size={48} />
      <p className="text-gray-500">No hay consultas registradas aún</p>
      <p className="text-sm text-gray-400 mt-1">
        Los datos aparecerán cuando los kioscos realicen consultas
      </p>
    </div>
  )}
                </div>
{/* 🔥 AGREGAR: Tabla de Consultas por Kiosco */}
{dashboardData?.consultasPorKiosco && dashboardData.consultasPorKiosco.length > 0 && (
  <div className="bg-white rounded-xl p-6 shadow-lg mt-6">
    <h3 className="text-lg font-bold text-gray-800 mb-4">
      Detalle de Consultas por Kiosco
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-gray-600 font-semibold">Kiosco</th>
            <th className="text-left py-3 px-4 text-gray-600 font-semibold">Ubicación</th>
            <th className="text-right py-3 px-4 text-gray-600 font-semibold">Total</th>
            <th className="text-right py-3 px-4 text-gray-600 font-semibold">Exitosas</th>
            <th className="text-right py-3 px-4 text-gray-600 font-semibold">Fallidas</th>
            <th className="text-right py-3 px-4 text-gray-600 font-semibold">Tasa Éxito</th>
          </tr>
        </thead>
        <tbody>
          {dashboardData.consultasPorKiosco.map((kiosco, index) => {
            const tasaExito =
              kiosco.total_consultas > 0
                ? ((kiosco.exitosas / kiosco.total_consultas) * 100).toFixed(1)
                : '0';

            return (
              <tr
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50 transition"
              >
                <td className="py-3 px-4 font-semibold text-gray-800">{kiosco.nombre}</td>
                <td className="py-3 px-4 text-gray-600">{kiosco.ubicacion}</td>
                <td className="py-3 px-4 text-right font-bold text-gray-800">
                  {kiosco.total_consultas}
                </td>
                <td className="py-3 px-4 text-right text-green-600 font-semibold">
                  {kiosco.exitosas}
                </td>
                <td className="py-3 px-4 text-right text-red-600 font-semibold">
                  {kiosco.fallidas}
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`font-semibold ${
                      parseFloat(tasaExito) >= 90
                        ? 'text-green-600'
                        : parseFloat(tasaExito) >= 70
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {tasaExito}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
)}

              </div>

              {/* Top Products Table */}
             <div className="bg-white rounded-xl p-6 shadow-lg">
  <h3 className="text-lg font-bold text-gray-800 mb-4">
    Productos Más Consultados
  </h3>
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4 text-gray-600 font-semibold">#</th>
          <th className="text-left py-3 px-4 text-gray-600 font-semibold">
            Nombre del Producto
          </th>
          <th className="text-left py-3 px-4 text-gray-600 font-semibold">
            Código de Barra
          </th>
          <th className="text-right py-3 px-4 text-gray-600 font-semibold">
            Consultas
          </th>
        </tr>
      </thead>
      <tbody>
        {productosConNombres.map((product) => (
          <tr
            key={product.codigo}
            className="border-b border-gray-100 hover:bg-gray-50 transition"
          >
            <td className="py-3 px-4 font-semibold text-gray-800">
              {product.posicion}
            </td>
            <td className="py-3 px-4">
              <span className="font-medium text-gray-800">{product.nombre}</span>
            </td>
            <td className="py-3 px-4">
              <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                {product.codigo}
              </code>
            </td>
            <td className="py-3 px-4 text-right font-semibold text-blue-600">
              {product.cantidad}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
            </>
          )}

  

{/* Kiosks Tab */}
{activeTab === 'kiosks' && (
  <div className="space-y-6">
    {/* Header con Botón Agregar */}
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Kioscos</h2>
        <p className="text-gray-500 mt-1">Administra todos los kioscos del sistema</p>
      </div>
      <button
        onClick={() => {
          // Abrir modal de crear kiosco
          setShowCreateModal(true);
        }}
        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        <Monitor size={16} />
        <span>Agregar Kiosco</span>
      </button>
    </div>

    {/* Resumen de Kioscos */}
    {tablaKioscos && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white">
          <p className="text-sm opacity-90">Total de Kioscos</p>
          <p className="text-4xl font-bold mt-2">{tablaKioscos.total_kioscos}</p>
        </div>
        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg text-white">
          <p className="text-sm opacity-90">Kioscos Activos</p>
          <p className="text-4xl font-bold mt-2">{tablaKioscos.kioscos_activos}</p>
        </div>
        <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg text-white">
          <p className="text-sm opacity-90">Promedio Consultas</p>
          <p className="text-4xl font-bold mt-2">
            {parseFloat(tablaKioscos.resumen.promedio_consultas_por_kiosco).toFixed(0)}
          </p>
        </div>
      </div>
    )}

    {/* Tabla de Kioscos */}
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 bg-linear-to-r from-blue-50 to-green-50 border-b">
        <h3 className="text-xl font-bold text-gray-800">
          📊 Estadísticas por Kiosco
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Consultas totales del sistema: {tablaKioscos?.resumen.total_consultas_sistema || 0}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                Kiosco
              </th>
              <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                Estado
              </th>
              <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                Total Consultas
              </th>
              <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                Exitosas
              </th>
              <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                Fallidas
              </th>
              <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                Tasa de Éxito
              </th>
              <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tablaKioscos?.tabla.map((kiosco: any) => (
              <tr key={kiosco.id} className="hover:bg-gray-50 transition-colors">
                {/* Nombre y Ubicación */}
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${kiosco.activo ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Monitor
                        className={kiosco.activo ? 'text-green-600' : 'text-gray-400'}
                        size={20}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{kiosco.nombre}</p>
                      <p className="text-xs text-gray-500">{kiosco.ubicacion}</p>
                    </div>
                  </div>
                </td>

                {/* Estado */}
                <td className="py-4 px-6 text-center">
                  {kiosco.activo ? (
                    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle size={14} />
                      <span>Activo</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      <AlertCircle size={14} />
                      <span>Inactivo</span>
                    </span>
                  )}
                </td>

                {/* Estadísticas */}
                <td className="py-4 px-6 text-right">
                  <span className="font-bold text-lg text-gray-800">
                    {kiosco.total_consultas.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="text-green-600 font-semibold">
                    {kiosco.consultas_exitosas.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="text-red-600 font-semibold">
                    {kiosco.consultas_fallidas.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          parseFloat(kiosco.tasa_exito) >= 90
                            ? 'bg-green-500'
                            : parseFloat(kiosco.tasa_exito) >= 70
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: kiosco.tasa_exito }}
                      />
                    </div>
                    <span className="font-semibold text-gray-700 min-w-12">
                      {kiosco.tasa_exito}
                    </span>
                  </div>
                </td>

                {/* Acciones */}
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => {
                        const kioskData = kioscos.find(k => k.id === kiosco.id);
                        setSelectedKiosk(
                          selectedKiosk?.id === kiosco.id ? null : kioskData || null
                        );
                      }}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                      title="Ver detalles"
                    >
                      <Settings size={16} />
                    </button>
                    <button
                      onClick={() => handleEditKiosco(kiosco)}
                      className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition"
                      title="Editar"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteKiosco(kiosco.id, kiosco.nombre)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                      title="Eliminar"
                    >
                      <AlertCircle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

     {/* Panel de Detalles del Kiosco Seleccionado */}
    {selectedKiosk && rendimientoKioscos && (
      <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              {selectedKiosk.nombre}
            </h3>
            <p className="text-gray-500 mt-1">{selectedKiosk.ubicacion}</p>
          </div>
          <button
            onClick={() => setSelectedKiosk(null)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Cerrar
          </button>
        </div>

        {(() => {
          const rendimiento = rendimientoKioscos.kioscos.find(
            (k: any) => k.id === selectedKiosk.id
          );
          
          if (!rendimiento) return null;

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información General */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Información General
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID:</span>
                    <span className="font-mono text-sm">{selectedKiosk.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha de Registro:</span>
                    <span className="font-medium">
                      {new Date(selectedKiosk.fecha_registro).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado Actual:</span>
                    <span
                      className={`font-medium ${
                        rendimiento.estado === 'alto_rendimiento'
                          ? 'text-green-600'
                          : rendimiento.estado === 'normal'
                          ? 'text-blue-600'
                          : rendimiento.estado === 'bajo_rendimiento'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {rendimiento.estado.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Métricas de Rendimiento */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Métricas de Rendimiento
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Histórico:</span>
                    <span className="font-bold text-gray-800">
                      {rendimiento.metricas.total_historico.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Últimas 24h:</span>
                    <span className="font-bold text-blue-600">
                      {rendimiento.metricas.ultimas_24h.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Últimos 7 días:</span>
                    <span className="font-bold text-purple-600">
                      {rendimiento.metricas.ultimos_7_dias.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Promedio Diario (7d):</span>
                    <span className="font-bold text-green-600">
                      {parseFloat(rendimiento.metricas.promedio_diario_7d).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tasa Éxito 24h:</span>
                    <span className="font-bold text-green-600">
                      {rendimiento.metricas.tasa_exito_24h}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    )}
   {/* Alertas de Rendimiento */}
    {rendimientoKioscos?.alertas && rendimientoKioscos.alertas.length > 0 && (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-yellow-600 shrink-0 mt-1" size={24} />
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-800 mb-2">
              ⚠️ Alertas de Kioscos
            </h4>
            <ul className="space-y-2">
              {rendimientoKioscos.alertas.map((alerta: any, index: number) => (
                <li key={index} className="text-sm text-yellow-700">
                  <span className="font-medium">{alerta.kiosco}:</span> {alerta.mensaje}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )}
  </div>
)}

{/* Modal Crear/Editar Kiosco */}
{showCreateModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">
          {editingKiosco ? 'Editar Kiosco' : 'Nuevo Kiosco'}
        </h3>
        <button
          onClick={() => {
            setShowCreateModal(false);
            setEditingKiosco(null);
            setFormData({ nombre: '', ubicacion: '', activo: true });
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmitKiosco} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Kiosco *
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Kiosco 3"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ubicación *
          </label>
          <input
            type="text"
            value={formData.ubicacion}
            onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Segundo Piso"
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <input title='boton'
            type="checkbox"
            checked={formData.activo}
            onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label className="text-sm text-gray-700">
            Kiosco activo
          </label>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setShowCreateModal(false);
              setEditingKiosco(null);
              setFormData({ nombre: '', ubicacion: '', activo: true });
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={formSubmitting}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
          >
            {formSubmitting ? 'Guardando...' : editingKiosco ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
{activeTab === 'products' && <ProductsTabs />}
{/* Reports Tab */}
{activeTab === 'reports' && (
  <div className="space-y-6">
    {/* Selector de Reportes */}
    <div className="bg-white rounded-xl p-4 shadow-lg">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setActiveReport('productos')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeReport === 'productos'
              ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📦 Top Productos
        </button>
        <button
          onClick={() => setActiveReport('kioscos')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeReport === 'kioscos'
              ? 'bg-linear-to-r from-green-500 to-green-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🖥️ Consultas por Kiosco
        </button>
        <button
          onClick={() => setActiveReport('mixto')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeReport === 'mixto'
              ? 'bg-linear-to-r from-purple-500 to-purple-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📊 Reporte Comparativo
        </button>
      </div>
    </div>

    {/* Contenido del Reporte */}
    {activeReport === 'productos' && <ReporteTopProductos />}
    {activeReport === 'kioscos' && <ReporteConsultasKiosco />}
    {activeReport === 'mixto' && <ReporteMixto />}
   
  </div>
)}
          {/* Video Tab */}
          {activeTab === 'video' && ( 
            <div>
            <VideoManager />
            </div>
          )}

          {/* Config Tab */}
{activeTab === 'config' && <ConfigDisplay />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;