// src/components/reports/ReporteTopProductos.tsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, RefreshCw, Download, Printer } from 'lucide-react';
import { getEstadisticasGenerales, getProductosNombres } from '../../service/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProductoConNombre {
  posicion: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

const ReporteTopProductos: React.FC = () => {
  const [productos, setProductos] = useState<ProductoConNombre[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalConsultas, setTotalConsultas] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const stats = await getEstadisticasGenerales();

      if (!stats.topProductos || stats.topProductos.length === 0) {
        setProductos([]);
        setTotalConsultas(0);
        return;
      }

      // Obtener nombres de todos los productos
      const codigos = stats.topProductos.map(p => p.codigo);
      const nombresMap = await getProductosNombres(codigos);

      // Crear lista con nombres
      const productosConNombres = stats.topProductos.map((p, index) => ({
        posicion: index + 1,
        codigo: p.codigo,
        nombre: nombresMap.get(p.codigo) || 'Desconocido',
        cantidad: p.cantidad,
        porcentaje: (p.cantidad / stats.total) * 100,
      }));

      setProductos(productosConNombres);
      setTotalConsultas(stats.total);
    } catch (error) {
      console.error('Error cargando productos:', error);
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
    doc.setTextColor(59, 130, 246);
    doc.text('Reporte: Top Productos Consultados', pageWidth / 2, 20, { align: 'center' });

    // Fecha
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, 28, { align: 'center' });

    // Resumen
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de Productos: ${productos.length}`, 14, 40);
    doc.text(`Total de Consultas: ${totalConsultas.toLocaleString()}`, 14, 47);

    // Tabla
    const tableData = productos.map(p => [
      p.posicion.toString(),
      p.nombre,
      p.codigo,
      p.cantidad.toLocaleString(),
      p.porcentaje.toFixed(1) + '%',
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['#', 'Producto', 'Código de Barra', 'Consultas', 'Porcentaje']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246] as any, // ✅ FIX: Agregar 'as any'
        textColor: [255, 255, 255] as any,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 45, fontStyle: 'normal' }, // ✅ FIX: 'font' no existe
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245] as any, // ✅ FIX: Agregar 'as any'
      },
      didDrawCell: (data) => {
        // Destacar top 3
        if (data.section === 'body' && data.column.index === 0) {
          const pos = parseInt(data.cell.text[0]);
          if (pos <= 3) {
            // ✅ FIX: Usar setFillColor correctamente
            if (pos === 1) {
              doc.setFillColor(255, 215, 0); // Oro
            } else if (pos === 2) {
              doc.setFillColor(192, 192, 192); // Plata
            } else {
              doc.setFillColor(205, 127, 50); // Bronce
            }

            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.text(
              data.cell.text[0],
              data.cell.x + data.cell.width / 2,
              data.cell.y + 6,
              { align: 'center' }
            );
          }
        }
      },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 55;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('KioskAdmin - Sistema de Gestión de Kioscos', pageWidth / 2, finalY + 15, { align: 'center' });

    // Guardar
    doc.save(`reporte-top-productos-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-500 to-blue-600 p-6 text-white print:bg-white print:text-gray-800 print:border-b-2 print:border-blue-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="p-3 bg-white/20 rounded-lg print:bg-blue-100 shrink-0">
              <TrendingUp size={24} className="print:text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Top Productos Consultados</h3>
              <p className="text-sm text-blue-100 mt-1 print:text-gray-600">
                {productos.length} productos • {totalConsultas.toLocaleString()} consultas totales
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

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="text-center py-4 px-6 text-xs font-bold text-gray-600 uppercase w-20">
                #
              </th>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                Producto
              </th>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                Código de Barra
              </th>
              <th className="text-right py-4 px-6 text-xs font-bold text-gray-600 uppercase">
                Consultas
              </th>
              <th className="text-right py-4 px-6 text-xs font-bold text-gray-600 uppercase w-40">
                Porcentaje
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {productos.map((producto) => (
              <tr
                key={producto.codigo}
                className="hover:bg-blue-50 transition-colors print:hover:bg-transparent"
              >
                {/* Posición */}
                <td className="py-4 px-6 text-center">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-white print:w-8 print:h-8 ${producto.posicion === 1
                        ? 'bg-linear-to-br from-yellow-400 to-yellow-500'
                        : producto.posicion === 2
                          ? 'bg-linear-to-br from-gray-300 to-gray-400'
                          : producto.posicion === 3
                            ? 'bg-linear-to-br from-orange-400 to-orange-500'
                            : 'bg-linear-to-br from-blue-400 to-blue-500'
                      }`}
                  >
                    {producto.posicion}
                  </div>
                </td>

                {/* Nombre del Producto */}
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg print:hidden">
                      <Package className="text-blue-600" size={20} />
                    </div>
                    <span className="font-semibold text-gray-800 text-base">
                      {producto.nombre}
                    </span>
                  </div>
                </td>

                {/* Código */}
                <td className="py-4 px-6">
                  <code className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono">
                    {producto.codigo}
                  </code>
                </td>

                {/* Cantidad */}
                <td className="py-4 px-6 text-right">
                  <span className="text-xl font-bold text-blue-600">
                    {producto.cantidad.toLocaleString()}
                  </span>
                </td>

                {/* Porcentaje con barra */}
                <td className="py-4 px-6">
                  <div className="space-y-1">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {producto.porcentaje.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 print:hidden">
                      <div
                        className="bg-linear-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${producto.porcentaje}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {productos.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-500 font-medium">No hay productos consultados aún</p>
          <p className="text-sm text-gray-400 mt-1">
            Los datos aparecerán cuando los kioscos realicen consultas
          </p>
        </div>
      )}

      {/* Footer para impresión */}
      <div className="hidden print:block bg-gray-50 p-4 border-t border-gray-200">
        <div className="text-center text-xs text-gray-500">
          <p>KioskAdmin - Sistema de Gestión de Kioscos</p>
          <p>Generado: {new Date().toLocaleString('es-ES')}</p>
        </div>
      </div>
    </div>
  );
};

export default ReporteTopProductos;