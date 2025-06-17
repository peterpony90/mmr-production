import React, { useState } from 'react';
import { X } from 'lucide-react';

interface IncidentsInputDialogProps {
  onConfirm: (incidents: string) => void;
  onClose: () => void;
}

export function IncidentsInputDialog({ onConfirm, onClose }: IncidentsInputDialogProps) {
  const [incidents, setIncidents] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(incidents);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Insertar incidencias identificadas
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="incidents" className="block text-sm font-medium text-gray-700">
                Incidencias (opcional)
              </label>
              <textarea
                id="incidents"
                rows={4}
                value={incidents}
                onChange={(e) => setIncidents(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#b41826] focus:ring-[#b41826] sm:text-sm"
                placeholder="Describe las incidencias identificadas durante la tarea..."
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-[#b41826] rounded-md hover:bg-[#a01522]"
              >
                Finalizar tarea
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}