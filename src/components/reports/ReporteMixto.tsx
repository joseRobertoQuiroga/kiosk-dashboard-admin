// src/components/reports/ReporteMixto.tsx
import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, RefreshCw, TrendingUp, Monitor, Download, Printer } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { getEstadisticasGenerales, getProductosNombres } from '../../service/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReporteMixto: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [productosData, setProductosData] = useState<any>(null);
  const [kioscosData, setKioscosData] = useState<any>(null);
  const [topProducto, setTopProducto] = useState('N/A');
  const [topKiosco, setTopKiosco] = useState('N/A');
  const [totalConsultas, setTotalConsultas] = useState(0);
  const [rawProductos, setRawProductos] = useState<any[]>([]);
  const [rawKioscos, setRawKioscos] = useState<any[]>([]);

  const chartProductosRef = useRef<any>(null);
  const chartKioscosRef = useRef<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const stats = await getEstadisticasGenerales();

      // Productos Chart Data
      if (stats.topProductos && stats.topProductos.length > 0) {
        const codigos = stats.topProductos.slice(0, 5).map(p => p.codigo);
        const nombresMap = await getProductosNombres(codigos);

        const nombres = stats.topProductos.slice(0, 5).map(p => nombresMap.get(p.codigo) || p.codigo);
        const cantidades = stats.topProductos.slice(0, 5).map(p => p.cantidad);

        setRawProductos(stats.topProductos.slice(0, 5).map((p, i) => ({
          nombre: nombres[i],
          cantidad: cantidades[i],
        })));

        setProductosData({
          labels: nombres,
          datasets: [{
            label: 'Consultas',
            data: cantidades,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
          }],
        });

        setTopProducto(nombres[0]);
        setTotalConsultas(cantidades.reduce((a: number, b: number) => a + b, 0));
      }

      // Kioscos Chart Data
      if (stats.consultasPorKiosco && stats.consultasPorKiosco.length > 0) {
        setRawKioscos(stats.consultasPorKiosco.map(k => ({
          nombre: k.nombre,
          ubicacion: k.ubicacion,
          consultas: k.total_consultas,
        })));

        setKioscosData({
          labels: stats.consultasPorKiosco.map(k => k.nombre),
          datasets: [{
            label: 'Consultas',
            data: stats.consultasPorKiosco.map(k => k.total_consultas),
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 2,
          }],
        });

        setTopKiosco(stats.consultasPorKiosco[0]?.nombre || 'N/A');
      }
    } catch (error) {
      console.error('Error cargando reporte mixto:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🖨️ FUNCIÓN PARA IMPRIMIR
  const handlePrint = () => {
    window.print();
  };

  // 📄 FUNCIÓN PARA EXPORTAR A PDF (SIN EMOJIS)
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Título principal
    doc.setFontSize(18);
    doc.setTextColor(147, 51, 234);
    doc.text('REPORTE COMPARATIVO', pageWidth / 2, 20, { align: 'center' });

    // Subtítulo
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Vista Consolidada de Productos y Kioscos', pageWidth / 2, 28, { align: 'center' });

    // Fecha
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, 35, { align: 'center' });

    // Línea separadora
    doc.setDrawColor(147, 51, 234);
    doc.setLineWidth(0.5);
    doc.line(14, 38, pageWidth - 14, 38);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SECCIÓN 1: ANÁLISIS RÁPIDO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('ANALISIS RAPIDO', 14, 48);

    // Fondo gris para el análisis
    doc.setFillColor(245, 245, 245);
    doc.rect(14, 52, pageWidth - 28, 20, 'F');

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Producto mas consultado: ${topProducto}`, 18, 59);
    doc.text(`Kiosco mas activo: ${topKiosco}`, 18, 65);
    doc.text(`Total consultas (Top 5): ${totalConsultas.toLocaleString()}`, 18, 71);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SECCIÓN 2: TOP 5 PRODUCTOS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('TOP 5 PRODUCTOS CONSULTADOS', 14, 84);

    const productosTableData = rawProductos.map((p, i) => [
      `${i + 1}`,
      p.nombre,
      p.cantidad.toLocaleString(),
    ]);

    autoTable(doc, {
      startY: 88,
      head: [['#', 'Producto', 'Consultas']],
      body: productosTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246] as any,
        textColor: [255, 255, 255] as any,
        fontStyle: 'bold',
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 120 },
        2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245] as any,
      },
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SECCIÓN 3: CONSULTAS POR KIOSCO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const startY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('CONSULTAS POR KIOSCO', 14, startY);

    const kioscosTableData = rawKioscos.map((k, i) => [
      `${i + 1}`,
      k.nombre,
      k.ubicacion,
      k.consultas.toLocaleString(),
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [['#', 'Kiosco', 'Ubicacion', 'Consultas']],
      body: kioscosTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [34, 197, 94] as any,
        textColor: [255, 255, 255] as any,
        fontStyle: 'bold',
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 50 },
        2: { cellWidth: 70 },
        3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245] as any,
      },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || startY + 4;

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, finalY + 10, pageWidth - 14, finalY + 10);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('KioskAdmin - Sistema de Gestion de Kioscos', pageWidth / 2, finalY + 15, { align: 'center' });

    // Guardar
    doc.save(`reporte-comparativo-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1,
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="bg-linear-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg print:bg-white print:text-gray-800 print:border-2 print:border-purple-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="p-3 bg-white/20 rounded-lg print:bg-purple-100 shrink-0">
              <BarChart3 size={24} className="print:text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Reporte Comparativo</h3>
              <p className="text-sm text-purple-100 mt-1 print:text-gray-600">
                Vista consolidada de productos y kioscos
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 print:hidden w-full md:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
              title="Imprimir"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={handleExportPDF}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
              title="Exportar PDF"
            >
              <Download size={20} />
            </button>
            <button
              onClick={loadData}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
              title="Actualizar"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Gráficos Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1">
        {/* Top Productos */}
        <div className="bg-white rounded-xl p-6 shadow-lg print:shadow-none print:border print:border-gray-200 print:break-inside-avoid">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="text-blue-600" size={20} />
            <h4 className="text-lg font-bold text-gray-800">Top 5 Productos</h4>
          </div>
          {productosData ? (
            <>
              <div className="h-80 print:hidden">
                <Bar ref={chartProductosRef} data={productosData} options={chartOptions} />
              </div>
              {/* Tabla para impresión */}
              <div className="hidden print:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-blue-500">
                      <th className="text-left py-2">#</th>
                      <th className="text-left py-2">Producto</th>
                      <th className="text-right py-2">Consultas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawProductos.map((p, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="py-2 font-bold text-blue-600">{i + 1}</td>
                        <td className="py-2">{p.nombre}</td>
                        <td className="py-2 text-right font-semibold">{p.cantidad.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>

        {/* Consultas por Kiosco */}
        <div className="bg-white rounded-xl p-6 shadow-lg print:shadow-none print:border print:border-gray-200 print:break-inside-avoid">
          <div className="flex items-center space-x-2 mb-4">
            <Monitor className="text-green-600" size={20} />
            <h4 className="text-lg font-bold text-gray-800">Consultas por Kiosco</h4>
          </div>
          {kioscosData ? (
            <>
              <div className="h-80 print:hidden">
                <Bar ref={chartKioscosRef} data={kioscosData} options={chartOptions} />
              </div>
              {/* Tabla para impresión */}
              <div className="hidden print:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-green-500">
                      <th className="text-left py-2">#</th>
                      <th className="text-left py-2">Kiosco</th>
                      <th className="text-left py-2">Ubicación</th>
                      <th className="text-right py-2">Consultas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawKioscos.map((k, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="py-2 font-bold text-green-600">{i + 1}</td>
                        <td className="py-2">{k.nombre}</td>
                        <td className="py-2 text-gray-600 text-xs">{k.ubicacion}</td>
                        <td className="py-2 text-right font-semibold">{k.consultas.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Insights Card */}
      <div className="bg-linear-to-r from-blue-50 to-green-50 rounded-xl p-6 border-2 border-purple-200 print:border print:border-gray-300">
        <h4 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
          <BarChart3 className="text-purple-600" size={20} />
          <span>Análisis Rápido</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm print:gap-2">
          <div className="bg-white rounded-lg p-4 shadow print:shadow-none print:border print:border-gray-200">
            <p className="text-gray-600 mb-1">Producto más consultado</p>
            <p className="font-bold text-blue-600 text-lg">
              {topProducto}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow print:shadow-none print:border print:border-gray-200">
            <p className="text-gray-600 mb-1">Kiosco más activo</p>
            <p className="font-bold text-green-600 text-lg">
              {topKiosco}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow print:shadow-none print:border print:border-gray-200">
            <p className="text-gray-600 mb-1">Total consultas (Top 5)</p>
            <p className="font-bold text-purple-600 text-lg">
              {totalConsultas.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Footer para impresión */}
      <div className="hidden print:block text-center text-xs text-gray-500 mt-4">
        <p>KioskAdmin - Sistema de Gestión de Kioscos</p>
        <p>Generado: {new Date().toLocaleString('es-ES')}</p>
      </div>
    </div>
  );
};

export default ReporteMixto;