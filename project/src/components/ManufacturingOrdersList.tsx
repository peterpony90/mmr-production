import React, { useState } from 'react';
import { Download, ChevronLeft, ChevronRight, Timer, Trash2, ChevronDown, ChevronUp, Eye, User, Pencil, AlertTriangle, FileText } from 'lucide-react';
import type { ManufacturingOrder } from '../lib/database';
import { utils, writeFile } from 'xlsx';
import { deleteManufacturingOrder } from '../lib/database';

interface Props {
  orders: ManufacturingOrder[];
  onSelectOrder: (order: ManufacturingOrder) => void;
  totalTimes: Record<string, { total: number, stages: Record<string, number>, users: Record<string, string> }>;
  onDeleteAll: () => Promise<void>;
  onOrdersChanged: () => Promise<void>;
  onEditOrder: (order: ManufacturingOrder) => void;
}

const stageNames: Record<string, string> = {
  assembly: 'Montaje',
  summary: 'Finalizado'
};

const ITEMS_PER_PAGE = 50;

const formatTime = (ms: number | null): string => {
  if (ms === null || ms === undefined) return '-';
  if (ms === 0) return '-';
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

const isManufacturingOrder = (number: string): boolean => {
  return !number.startsWith('Tarea_');
};

export function ManufacturingOrdersList({ orders, onSelectOrder, totalTimes, onDeleteAll, onOrdersChanged, onEditOrder }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, orders.length);
  const paginatedOrders = orders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedOrder(null);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === paginatedOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(paginatedOrders.map(order => order.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedOrders.size === 0) return;
    
    if (window.confirm(`¿Estás seguro de que deseas eliminar ${selectedOrders.size} orden(es) seleccionada(s)? Esta acción no se puede deshacer.`)) {
      try {
        setIsDeleting(true);
        await Promise.all(Array.from(selectedOrders).map(orderId => deleteManufacturingOrder(orderId)));
        setSelectedOrders(new Set());
        await onOrdersChanged();
      } catch (error) {
        console.error('Error deleting selected orders:', error);
        alert('Error al eliminar las órdenes seleccionadas. Por favor, inténtalo de nuevo.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todas las órdenes de fabricación? Esta acción no se puede deshacer.')) {
      setIsDeleting(true);
      try {
        await onDeleteAll();
        setSelectedOrders(new Set());
      } catch (error) {
        console.error('Error deleting orders:', error);
        alert('Error al eliminar las órdenes. Por favor, inténtalo de nuevo.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta orden de fabricación? Esta acción no se puede deshacer.')) {
      try {
        await deleteManufacturingOrder(orderId);
        await onOrdersChanged();
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Error al eliminar la orden. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const handleExportToExcel = () => {
    const data = orders.map(order => {
      const times = totalTimes[order.id]?.stages || {};
      const users = totalTimes[order.id]?.users || {};
      return {
        'Número de O. fabricación': order.manufacturing_number,
        'Orden de fabricación': isManufacturingOrder(order.manufacturing_number) ? 'Sí' : 'No',
        'Fecha inicio': formatDate(order.created_at),
        'Fecha finalización': order.completed_at ? formatDate(order.completed_at) : '-',
        'Etapa actual': stageNames[order.current_stage],
        'Tiempo Total': formatTime(totalTimes[order.id]?.total || null),
        'Tiempo Montaje': formatTime(times.assembly || null),
        'Usuario': users.assembly || '-',
        'Creado por': order.profile?.name || order.profile?.email?.split('@')[0] || 'Usuario desconocido',
        'Descripción': order.incident_description || '-'
      };
    });

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Órdenes de Fabricación');
    
    const colWidths = [
      { wch: 25 }, // Número de O. fabricación
      { wch: 10 }, // Orden de fabricación
      { wch: 20 }, // Fecha inicio
      { wch: 20 }, // Fecha finalización
      { wch: 15 }, // Etapa actual
      { wch: 15 }, // Tiempo Total
      { wch: 15 }, // Tiempo Montaje
      { wch: 20 }, // Usuario
      { wch: 20 }, // Creado por
      { wch: 40 }  // Descripción
    ];
    ws['!cols'] = colWidths;

    writeFile(wb, 'ordenes_fabricacion.xlsx');
  };

  const handleToggleDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          Órdenes de fabricación ({orders.length})
        </h2>
        <div className="flex items-center gap-4">
          {selectedOrders.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Eliminando...' : `Eliminar seleccionadas (${selectedOrders.size})`}
            </button>
          )}
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
              <th className="w-8 px-6 py-3">
                <input
                  type="checkbox"
                  checked={selectedOrders.size === paginatedOrders.length && paginatedOrders.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-[#b41826] focus:ring-[#b41826]"
                />
              </th>
              <th className="w-8 px-6 py-3"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nº O. Fabricación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                O. Fabricación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Inicio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Finalización
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tiempo Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Etapa Actual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creado por
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
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => handleSelectOrder(order.id)}
                      className="rounded border-gray-300 text-[#b41826] focus:ring-[#b41826]"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleDetails(order.id)}
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
                    {isManufacturingOrder(order.manufacturing_number) ? 'Sí' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.completed_at ? formatDate(order.completed_at) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      {formatTime(totalTimes[order.id]?.total || null)}
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
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {order.profile?.name || order.profile?.email?.split('@')[0] || 'Usuario desconocido'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onSelectOrder(order)}
                        className="flex items-center gap-1 text-[#b41826] hover:text-[#a01522] font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      <button
                        onClick={() => onEditOrder(order)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedOrder === order.id && (
                  <tr>
                    <td colSpan={10} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="font-medium text-gray-900 mb-2">
                              Detalles de la tarea
                            </div>
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Tiempo de montaje:</h4>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Timer className="w-4 h-4" />
                                  {formatTime(totalTimes[order.id]?.stages.assembly || null)}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Operario:</h4>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <User className="w-4 h-4" />
                                  {totalTimes[order.id]?.users.assembly || '-'}
                                </div>
                              </div>
                              {order.incident_description && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                                    {isManufacturingOrder(order.manufacturing_number) ? 'Incidencias:' : 'Descripción:'}
                                  </h4>
                                  <p className="text-gray-600 whitespace-pre-wrap">
                                    {order.incident_description}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
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
              Mostrando {startIndex + 1}-{endIndex} de {orders.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 hover:text-[#b41826] disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-700">
                {currentPage} de {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 hover:text-[#b41826] disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="ml-2 px-3 py-1 text-sm text-gray-600 hover:text-[#b41826]"
                >
                  +{ITEMS_PER_PAGE}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}