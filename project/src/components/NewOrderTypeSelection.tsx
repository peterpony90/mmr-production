import React from 'react';
import { ClipboardList, Wrench, ArrowLeft } from 'lucide-react';

interface NewOrderTypeSelectionProps {
  onSelectType: (type: 'with-number' | 'without-number') => void;
  onBack: () => void;
  hasOpenTasks?: boolean;
}

export function NewOrderTypeSelection({ onSelectType, onBack, hasOpenTasks = false }: NewOrderTypeSelectionProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-xl font-semibold mb-6 text-center">
          Crear nueva tarea
        </h2>
        
        {hasOpenTasks && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No puedes crear una nueva tarea
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Tienes una tarea abierta. Debes finalizarla antes de crear una nueva.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => onSelectType('with-number')}
            disabled={hasOpenTasks}
            className={`flex flex-col items-center justify-center p-8 rounded-lg transition-all duration-300 group ${
              hasOpenTasks
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-[#b41826] to-[#8a1219] text-white hover:from-[#a01522] hover:to-[#7a1017]'
            }`}
          >
            <ClipboardList className={`w-16 h-16 mb-4 transition-transform duration-300 ${
              hasOpenTasks ? '' : 'group-hover:scale-110'
            }`} />
            <h3 className="text-xl font-semibold mb-2">Insertar Orden de Fabricación</h3>
            <p className="text-sm text-center opacity-90">
              Crear una tarea con número de fabricación
            </p>
          </button>

          <button
            onClick={() => onSelectType('without-number')}
            disabled={hasOpenTasks}
            className={`flex flex-col items-center justify-center p-8 rounded-lg transition-all duration-300 group ${
              hasOpenTasks
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800'
            }`}
          >
            <Wrench className={`w-16 h-16 mb-4 transition-transform duration-300 ${
              hasOpenTasks ? '' : 'group-hover:scale-110'
            }`} />
            <h3 className="text-xl font-semibold mb-2">Sin Orden de Fabricación</h3>
            <p className="text-sm text-center opacity-90">
              Registrar tarea sin número de fabricación
            </p>
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={onBack}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al menú
          </button>
        </div>
      </div>
    </div>
  );
}