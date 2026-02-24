import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Video,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Play,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  getVideos,
  getVideoStats,
  uploadVideo,
  reorderVideos,
  updateVideo,
  deleteVideo,
  getVideoStreamUrl,
  type Video as VideoType,
} from './service/api';

const VideoManager: React.FC = () => {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoType | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);  // ✅ Limpiar errores previos

      const [videosData, statsData] = await Promise.all([
        getVideos(),
        getVideoStats(),
      ]);

      console.log('📹 Videos cargados:', videosData);
      console.log('📊 Stats cargadas:', statsData);

      setVideos(videosData);
      setStats(statsData);
    } catch (err: any) {
      console.error('❌ Error cargando videos:', err);
      setError(err.response?.data?.message || 'Error al cargar videos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    // ✅ CORREGIDO: Pasar "titulo" en lugar de "nombre"
    const result = await uploadVideo(file, file.name);

    if (result.success) {
      await loadData();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setError(result.error || 'Error al subir video');
    }

    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este video?')) return;

    try {
      await deleteVideo(id);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar video');
    }
  };

  const handleToggleActive = async (video: VideoType) => {
    try {
      await updateVideo(video.id, { activo: !video.activo });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar video');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newVideos = [...videos];
    const draggedVideo = newVideos[draggedIndex];
    newVideos.splice(draggedIndex, 1);
    newVideos.splice(index, 0, draggedVideo);

    setVideos(newVideos);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    try {
      const videoIds = videos.map(v => v.id);
      await reorderVideos(videoIds);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al reordenar videos');
    }

    setDraggedIndex(null);
  };

  const formatFileSize = (bytes?: number | null): string => {
    if (!bytes) return '0 MB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando videos...</p>
        </div>
      </div>
    );
  }

  // ✅ CORREGIDO: Calcular espacios disponibles de forma segura
  const espaciosDisponibles = stats ? (5 - (stats.total || 0)) : 0;
  const puedeSubir = espaciosDisponibles > 0;

  return (
    <div className="space-y-6">
      {/* Header con Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Videos Totales</p>
          <p className="text-3xl font-bold mt-1">
            {stats?.total || 0}/5
          </p>
        </div>
        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Videos Activos</p>
          <p className="text-3xl font-bold mt-1">{stats?.activos || 0}</p>
        </div>
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Espacios Disponibles</p>
          <p className="text-3xl font-bold mt-1">{espaciosDisponibles}</p>
        </div>
        <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Tamaño Total</p>
          <p className="text-3xl font-bold mt-1">{stats?.totalSizeMB || 0}</p>
          <p className="text-xs opacity-75">MB</p>
        </div>
      </div>

      {/* Área de Upload */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Subir Nuevo Video
        </h3>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} title='bont'>
              <X className="text-red-400 hover:text-red-600" size={20} />
            </button>
          </div>
        )}

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${puedeSubir
              ? 'border-purple-300 hover:border-purple-500 cursor-pointer bg-purple-50'
              : 'border-gray-300 bg-gray-50 cursor-not-allowed'
            }`}
          onClick={() => {
            if (puedeSubir && !uploading) {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            title='Seleccionar video'
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo"
            onChange={handleFileSelect}
            className="hidden"
            disabled={!puedeSubir || uploading}
          />

          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">Subiendo video...</p>
              <p className="text-sm text-gray-500 mt-2">Por favor espera</p>
            </>
          ) : puedeSubir ? (
            <>
              <Upload className="mx-auto text-purple-500 mb-4" size={48} />
              <p className="text-gray-700 font-medium mb-2">
                Haz clic para subir o arrastra el video aquí
              </p>
              <p className="text-sm text-gray-500">
                MP4, AVI, MOV (máx. 100MB) • {espaciosDisponibles} espacios disponibles
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium">
                Límite de videos alcanzado
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Elimina un video existente para subir uno nuevo
              </p>
            </>
          )}
        </div>
      </div>

      {/* Lista de Videos con Drag & Drop */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Videos Subidos ({videos.length})
        </h3>

        {videos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Video className="mx-auto mb-4 opacity-50" size={48} />
            <p>No hay videos subidos</p>
            <p className="text-sm mt-2">Sube tu primer video para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video, index) => (
              <div
                key={video.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg transition-all cursor-move ${draggedIndex === index
                    ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                  }`}
              >
                {/* Handle de Drag */}
                <div className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="text-gray-400" size={20} />
                </div>

                {/* Orden */}
                <div className="shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-700 font-bold text-sm">{index + 1}</span>
                </div>

                {/* Thumbnail (placeholder) */}
                <div className="shrink-0 w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                  <Video className="text-gray-400" size={32} />
                </div>

                {/* Info - ✅ CORREGIDO: usar 'titulo' */}
                <div className="flex-1 w-full md:w-auto text-center md:text-left min-w-0">
                  <h4 className="font-semibold text-gray-800 truncate px-2 md:px-0">
                    {video.titulo}
                  </h4>
                  <div className="flex items-center justify-center md:justify-start gap-4 mt-1 text-sm text-gray-500">
                    <span>{formatFileSize(video.tamanio)}</span>
                    <span>•</span>
                    <span>{new Date(video.fecha_creacion).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Estado */}
                <div className="shrink-0">
                  {video.activo ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle size={14} />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      <AlertCircle size={14} />
                      Inactivo
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewVideo(video)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                    title="Vista previa"
                  >
                    <Play size={18} />
                  </button>

                  <button
                    onClick={() => handleToggleActive(video)}
                    className={`p-2 rounded-lg transition ${video.activo
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                    title={video.activo ? 'Desactivar' : 'Activar'}
                  >
                    {video.activo ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>

                  <button
                    onClick={() => handleDelete(video.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Vista Previa - ✅ CORREGIDO */}
      {previewVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {previewVideo.titulo}
                </h3>
                <button title='bont'
                  onClick={() => setPreviewVideo(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>

              <video
                controls
                autoPlay
                className="w-full rounded-lg bg-black"
                src={getVideoStreamUrl(previewVideo.id)}
              >
                Tu navegador no soporta la reproducción de videos
              </video>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Tamaño:</span>
                  <span className="ml-2 font-medium">{formatFileSize(previewVideo.tamanio)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Orden:</span>
                  <span className="ml-2 font-medium">#{previewVideo.orden + 1}</span>
                </div>
                <div>
                  <span className="text-gray-600">Fecha de subida:</span>
                  <span className="ml-2 font-medium">
                    {new Date(previewVideo.fecha_creacion).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <span className={`ml-2 font-medium ${previewVideo.activo ? 'text-green-600' : 'text-gray-600'}`}>
                    {previewVideo.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoManager;