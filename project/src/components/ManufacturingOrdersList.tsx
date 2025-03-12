import React, { useState } from 'react';
import { Download, ChevronLeft, ChevronRight, Timer, Trash2, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import type { ManufacturingOrder } from '../lib/database';
import { utils, writeFile } from 'xlsx';

interface Props {
  orders: ManufacturingOrder[];
  onSelectOrder: (order: ManufacturingOrder) => void;
  totalTimes: Record<string, { total: number, stages: Record<string, number> }>;
  onDeleteAll: () => Promise<void>;
}

const stageNames: Record<string, string> = {
  form: 'Inicio',
  sticker: 'Pegatinado',
  cutting: 'Corte y cableado',
  assembly: 'Montaje',
  packaging: 'Embalaje',
  summary: 'Finalizado'
};

const ITEMS_PER_PAGE = 10;

const formatTime = (ms: number): string => {
  if (!ms) return '00:00.00';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export function ManufacturingOrdersList({ orders, onSelectOrder, totalTimes, onDeleteAll }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = orders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedOrder(null);
  };

  const handleDeleteAll = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todas las órdenes de fabricación? Esta acción no se puede deshacer.')) {
      setIsDeleting(true);
      try {
        await onDeleteAll();
      } catch (error) {
        console.error('Error deleting orders:', error);
        alert('Error al eliminar las órdenes. Por favor, inténtalo de nuevo.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleExportToExcel = () => {
    const data = orders.map(order => ({
      'Número de O. fabricación': order.manufacturing_number,
      'Modelo': order.bicycle_model,
      'Fecha inicio': formatDate(order.created_at),
      'Etapa actual': stageNames[order.current_stage],
      'Tiempo Total': formatTime(totalTimes[order.id]?.total || 0),
      'Tiempo Pegatinado': formatTime(totalTimes[order.id]?.stages?.sticker || 0),
      'Tiempo Corte y cableado': formatTime(totalTimes[order.id]?.stages?.cutting || 0),
      'Tiempo Montaje': formatTime(totalTimes[order.id]?.stages?.assembly || 0),
      'Tiempo Embalaje': formatTime(totalTimes[order.id]?.stages?.packaging || 0)
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Órdenes de Fabricación');
    
    const colWidths = [
      { wch: 25 }, // Número de O. fabricación
      { wch: 20 }, // Modelo
      { wch: 20 }, // Fecha inicio
      { wch: 15 }, // Etapa actual
      { wch: 15 }, // Tiempo Total
      { wch: 15 }, // Tiempo Pegatinado
      { wch: 20 }, // Tiempo Corte y cableado
      { wch: 15 }, // Tiempo Montaje
      { wch: 15 }  // Tiempo Embalaje
    ];
    ws['!cols'] = colWidths;

    writeFile(wb, 'ordenes_fabricacion.xlsx');
  };

  const handleExpandOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStageStatus = (order: ManufacturingOrder, stage: string) => {
    const stages = ['sticker', 'cutting', 'assembly', 'packaging'];
    const currentIndex = stages.indexOf(order.current_stage);
    const stageIndex = stages.indexOf(stage);

    if (order.current_stage === 'summary') {
      return 'completed';
    }

    if (stageIndex < currentIndex) {
      return 'completed';
    }

    if (stageIndex === currentIndex) {
      return 'current';
    }

    return 'pending';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          Órdenes de fabricación ({orders.length})
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleExportToExcel}
            disabled={orders.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exportar a Excel
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={isDeleting || orders.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Eliminando...' : 'Eliminar todo'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="w-8 px-6 py-3"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nº O. Fabricación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modelo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Inicio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tiempo Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Etapa Actual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedOrders.map((order) => (
              <React.Fragment key={order.id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleExpandOrder(order.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedOrder === order.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.manufacturing_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.bicycle_model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      {formatTime(totalTimes[order.id]?.total || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-3 py-1 rounded-full ${
                      order.current_stage === 'summary'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {stageNames[order.current_stage]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => onSelectOrder(order)}
                      className="flex items-center gap-2 text-[#b41826] hover:text-[#a01522] font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Ver orden
                    </button>
                  </td>
                </tr>
                {expandedOrder === order.id && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Tiempos por etapa:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {['sticker', 'cutting', 'assembly', 'packaging'].map((stage) => {
                            const status = getStageStatus(order, stage);
                            return (
                              <div
                                key={stage}
                                className={`bg-white p-4 rounded-lg shadow-sm border ${
                                  status === 'completed'
                                    ? 'border-green-200 bg-green-50'
                                    : status === 'current'
                                    ? 'border-blue-200 bg-blue-50'
                                    : 'border-gray-200'
                                }`}
                              >
                                <div className="font-medium text-gray-900 mb-2">
                                  {stageNames[stage]}
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Timer className="w-4 h-4" />
                                  {formatTime(totalTimes[order.id]?.stages[stage] || 0)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            No hay órdenes de fabricación
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, orders.length)} de {orders.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 hover:text-[#b41826] disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === page
                      ? 'bg-[#b41826] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 hover:text-[#b41826] disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}