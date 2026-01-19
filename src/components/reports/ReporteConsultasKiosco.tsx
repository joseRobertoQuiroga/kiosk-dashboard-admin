// src/components/reports/ReporteConsultasKiosco.tsx
import React, { useState, useEffect } from 'react';
import { Monitor, Activity, RefreshCw, CheckCircle, AlertCircle, Download, Printer } from 'lucide-react';
import { getTablaKioscos } from '../../service/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface KioscoStats {
  id: string;
  nombre: string;
  ubicacion: string;
  activo: boolean;
  total_consultas: number;
  consultas_exitosas: number;
  consultas_fallidas: number;
  tasa_exito: string;
}

const ReporteConsultasKiosco: React.FC = () => {
  const [kioscos, setKioscos] = useState<KioscoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getTablaKioscos();
      setKioscos(data.tabla);
      setResumen(data.resumen);
    } catch (error) {
      console.error('Error cargando kioscos:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🖨️ FUNCIÓN PARA IMPRIMIR
  const handlePrint = () => {
    window.print();
  };

  // 📄 FUNCIÓN PARA EXPORTAR A PDF (CORREGIDA)
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(34, 197, 94);
    doc.text('Reporte: Consultas por Kiosco', pageWidth / 2, 20, { align: 'center' });
    
    // Fecha
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, 28, { align: 'center' });
    
    // Resumen
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de Kioscos: ${kioscos.length}`, 14, 40);
    doc.text(`Total Consultas: ${resumen?.total_consultas_sistema.toLocaleString() || 0}`, 14, 47);
    doc.text(`Promedio por Kiosco: ${parseFloat(resumen?.promedio_consultas_por_kiosco || 0).toFixed(0)}`, 14, 54);
    
    // Tabla
    const tableData = kioscos.map(k => [
      k.nombre,
      k.ubicacion,
      k.activo ? 'Activo' : 'Inactivo',
      k.total_consultas.toLocaleString(),
      k.consultas_exitosas.toLocaleString(),
      k.consultas_fallidas.toLocaleString(),
      k.tasa_exito,
    ]);

    autoTable(doc, {
      startY: 62,
      head: [['Kiosco', 'Ubicación', 'Estado', 'Total', 'Exitosas', 'Fallidas', 'Tasa Éxito']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [34, 197, 94] as any, // ✅ FIX
        textColor: [255, 255, 255] as any,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245] as any, // ✅ FIX
      },
    });
    
    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 62;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('KioskAdmin - Sistema de Gestión de Kioscos', pageWidth / 2, finalY + 15, { align: 'center' });
    
    // Guardar
    doc.save(`reporte-kioscos-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none">
      {/* Header */}
      <div className="bg-linear-to-r from-green-500 to-green-600 p-6 text-white print:bg-white print:text-gray-800 print:border-b-2 print:border-green-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-lg print:bg-green-100">
              <Monitor size={24} className="print:text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Consultas por Kiosco</h3>
              <p className="text-sm text-green-100 mt-1 print:text-gray-600">
                {kioscos.length} kioscos • {resumen?.total_consultas_sistema.toLocaleString()} consultas
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 print:hidden">
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

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                Kiosco
              </th>
              <th className="text-center py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                Estado
              </th>
              <th className="text-right py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                Total
              </th>
              <th className="text-right py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                Exitosas
              </th>
              <th className="text-right py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                Fallidas
              </th>
              <th className="text-right py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                Tasa Éxito
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {kioscos.map((kiosco) => (
              <tr key={kiosco.id} className="hover:bg-green-50 transition-colors print:hover:bg-transparent">
                {/* Kiosco */}
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

                {/* Total */}
                <td className="py-4 px-6 text-right">
                  <span className="text-xl font-bold text-gray-800">
                    {kiosco.total_consultas.toLocaleString()}
                  </span>
                </td>

                {/* Exitosas */}
                <td className="py-4 px-6 text-right">
                  <span className="text-lg font-semibold text-green-600">
                    {kiosco.consultas_exitosas.toLocaleString()}
                  </span>
                </td>

                {/* Fallidas */}
                <td className="py-4 px-6 text-right">
                  <span className="text-lg font-semibold text-red-600">
                    {kiosco.consultas_fallidas.toLocaleString()}
                  </span>
                </td>

                {/* Tasa Éxito */}
                <td className="py-4 px-6">
                  <div className="space-y-1">
                    <div className="flex items-center justify-end space-x-2">
                      <span className={`text-sm font-bold ${
                        parseFloat(kiosco.tasa_exito) >= 90
                          ? 'text-green-600'
                          : parseFloat(kiosco.tasa_exito) >= 70
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {kiosco.tasa_exito}
                      </span>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2 print:hidden">
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumen Footer */}
      {resumen && (
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="text-gray-600" size={16} />
              <span className="text-gray-600 font-medium">
                Promedio por kiosco:
              </span>
              <span className="font-bold text-gray-800">
                {parseFloat(resumen.promedio_consultas_por_kiosco).toFixed(0)} consultas
              </span>
            </div>
            <span className="text-xs text-gray-500">
              Generado: {new Date().toLocaleString('es-ES')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReporteConsultasKiosco;