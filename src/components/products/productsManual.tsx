import React, { useState, useEffect, useRef } from 'react';
import { Package, Plus, Edit2, Trash2, Search, X, Image as ImageIcon } from 'lucide-react';
import { 
  getAllProductos, 
  createProducto, 
  updateProducto, 
  deleteProducto,
  type ProductoComplete,
  type ProductoCreate 
} from '../../service/api';

const ProductsManager: React.FC = () => {
  const [productos, setProductos] = useState<ProductoComplete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductoComplete | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProductoCreate>({
    codigo: '',
    nombre: '',
    precio: 0,
    detalles: '',
    categoria: '',
    promocion: '', // ✅ INCLUIDO
  });

  useEffect(() => {
    loadProductos();
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // 📦 CARGAR PRODUCTOS CON VALIDACIÓN
  // ═══════════════════════════════════════════════════════════════

  const loadProductos = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando productos desde API...');
      
      const data = await getAllProductos();
      
      // 🔥 VALIDAR DATOS RECIBIDOS
      const productosValidados = data.map((p, index) => {
        if (typeof p.codigo !== 'string') {
          console.warn(`⚠️ Producto ${index + 1}: código no es string, convirtiendo...`);
          p.codigo = String(p.codigo);
        }
        return p;
      });

      // Detectar duplicados
      const codigos = productosValidados.map(p => p.codigo);
      const duplicados = codigos.filter((codigo, index) => codigos.indexOf(codigo) !== index);
      
      if (duplicados.length > 0) {
        console.error('❌ CÓDIGOS DUPLICADOS:', duplicados);
      }

      setProductos(productosValidados);
      console.log('✅ Productos cargados:', productosValidados.length);
      
    } catch (error: any) {
      console.error('❌ Error cargando productos:', error);
      alert(`Error al cargar productos: ${error.response?.data?.mensaje || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🖼️ MANEJO DE IMÁGENES
  // ═══════════════════════════════════════════════════════════════

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) handleImageFile(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) handleImageFile(files[0]);
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('⚠️ Solo se permiten archivos de imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('⚠️ La imagen no debe superar 5 MB');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ═══════════════════════════════════════════════════════════════
  // 💾 GUARDAR PRODUCTO
  // ═══════════════════════════════════════════════════════════════

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigo || !formData.nombre || !formData.categoria || !formData.detalles) {
      alert('⚠️ Por favor completa todos los campos obligatorios');
      return;
    }

    if (formData.precio <= 0) {
      alert('⚠️ El precio debe ser mayor a 0');
      return;
    }

    setFormSubmitting(true);

    try {
      if (editingProduct) {
        // ✅ MODO EDICIÓN - INCLUIR PROMOCIÓN
        await updateProducto(
          editingProduct.codigo,
          {
            codigo: editingProduct.codigo,
            nombre: formData.nombre,
            precio: formData.precio,
            detalles: formData.detalles,
            categoria: formData.categoria,
            promocion: formData.promocion || '', // ✅ INCLUIDO
          },
          selectedImage || undefined
        );
        alert(`✅ Producto "${formData.nombre}" actualizado exitosamente`);
      } else {
        // ✅ MODO CREACIÓN
        if (!selectedImage) {
          alert('⚠️ Por favor selecciona una imagen para el producto');
          setFormSubmitting(false);
          return;
        }
        await createProducto(formData, selectedImage);
        alert(`✅ Producto "${formData.nombre}" creado exitosamente`);
      }

      closeModal();
      await loadProductos();
    } catch (error: any) {
      console.error('❌ Error guardando producto:', error);
      const errorMsg = error.response?.data?.mensaje || error.response?.data?.message || error.message;
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // ✏️ EDITAR PRODUCTO
  // ═══════════════════════════════════════════════════════════════

  const handleEdit = (product: ProductoComplete) => {
    setEditingProduct(product);
    setFormData({
      codigo: product.codigo,
      nombre: product.nombre,
      precio: product.precio,
      detalles: product.detalles,
      categoria: product.categoria,
      promocion: product.promocion || '', // ✅ INCLUIDO
    });
    setImagePreview(product.imagen_url);
    setShowModal(true);
  };

  // ═══════════════════════════════════════════════════════════════
  // 🗑️ ELIMINAR PRODUCTO
  // ═══════════════════════════════════════════════════════════════

  const handleDelete = async (codigo: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el producto "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteProducto(codigo);
      alert(`✅ Producto "${nombre}" eliminado exitosamente`);
      await loadProductos();
    } catch (error: any) {
      console.error('❌ Error eliminando producto:', error);
      const errorMsg = error.response?.data?.mensaje || error.response?.data?.message || error.message;
      alert(`❌ Error al eliminar: ${errorMsg}`);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🚪 CERRAR MODAL
  // ═══════════════════════════════════════════════════════════════

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      codigo: '',
      nombre: '',
      precio: 0,
      detalles: '',
      categoria: '',
      promocion: '', // ✅ INCLUIDO
    });
    clearImage();
  };

  // ═══════════════════════════════════════════════════════════════
  // 🔍 FILTRAR PRODUCTOS
  // ═══════════════════════════════════════════════════════════════

  const filteredProducts = productos.filter(p => {
    const searchLower = searchTerm.toLowerCase().trim();
    if (searchLower === '') return true;

    try {
      const codigoStr = String(p.codigo || '').toLowerCase();
      const nombreStr = (p.nombre || '').toLowerCase();
      const categoriaStr = (p.categoria || '').toLowerCase();

      return (
        nombreStr.includes(searchLower) ||
        codigoStr.includes(searchLower) ||
        categoriaStr.includes(searchLower)
      );
    } catch (error) {
      console.error('Error filtrando producto:', p, error);
      return false;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Productos</h2>
          <p className="text-gray-500 mt-1">{productos.length} productos registrados</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({ 
              codigo: '', 
              nombre: '', 
              precio: 0, 
              detalles: '', 
              categoria: '',
              promocion: '' // ✅ INCLUIDO
            });
            clearImage();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          <Plus size={20} />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white rounded-xl p-4 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, código o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Limpiar búsqueda"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            {filteredProducts.length > 0 ? (
              <span>✅ {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''}</span>
            ) : (
              <span className="text-red-600">❌ No se encontraron productos</span>
            )}
          </div>
        )}
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">Imagen</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">Código</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">Producto</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">Categoría</th>
                <th className="text-right py-4 px-6 text-xs font-bold text-gray-600 uppercase">Precio</th>
                <th className="text-center py-4 px-6 text-xs font-bold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((producto, index) => (
                <tr 
                  key={`producto-${producto.codigo}-${index}`}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <img 
                      src={producto.imagen_url} 
                      alt={producto.nombre}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                      }}
                    />
                  </td>
                  <td className="py-4 px-6">
                    <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                      {producto.codigo}
                    </code>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-semibold text-gray-800">{producto.nombre}</p>
                      <p className="text-xs text-gray-500">{producto.detalles}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {producto.categoria}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-lg font-bold text-gray-800">
                      ${producto.precio.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(producto)}
                        className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(producto.codigo, producto.nombre)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-500 font-medium">
              {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
            </p>
            {!searchTerm && (
              <p className="text-sm text-gray-400 mt-2">
                Haz clic en "Agregar Producto" para comenzar
              </p>
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                  disabled={formSubmitting}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Código */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Barras *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ej: 1234567890"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Coca-Cola 500ml"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ej: Bebidas, Snacks, Dulces"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Precio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                    placeholder="Ej: 8.50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Detalles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detalles *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.detalles}
                    onChange={(e) => setFormData({ ...formData, detalles: e.target.value })}
                    placeholder="Descripción del producto..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Promoción - ✅ CAMPO AGREGADO */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promoción (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.promocion || ''}
                    onChange={(e) => setFormData({ ...formData, promocion: e.target.value })}
                    placeholder="Ej: 2x1, 10% descuento, Precio especial"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Puedes escribir texto (ej: "2x1") o un número (ej: "15" para 15%)
                  </p>
                </div>

                {/* Imagen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen {!editingProduct && '*'}
                  </label>
                  
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                      >
                        <X size={16} />
                      </button>
                      {editingProduct && (
                        <p className="text-xs text-gray-500 mt-2">
                          ℹ️ Dejar vacío para mantener la imagen actual
                        </p>
                      )}
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragging 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <ImageIcon className="mx-auto text-gray-400 mb-3" size={48} />
                      <p className="text-gray-600 font-medium">
                        Haz clic o arrastra una imagen aquí
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        JPG, PNG, GIF o WEBP (máx. 5 MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={formSubmitting}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formSubmitting ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManager;