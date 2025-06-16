import React from 'react';
import { PlusCircle, ClipboardList } from 'lucide-react';

interface MainMenuProps {
  onNewOrder: () => void;
  onViewOrders: () => void;
  hasOpenTasks?: boolean;
}

export function MainMenu({ onNewOrder, onViewOrders, hasOpenTasks = false }: MainMenuProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-8">MMR Production Control</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={onNewOrder}
            disabled={hasOpenTasks}
            className={`flex flex-col items-center justify-center p-8 rounded-lg transition-all duration-300 group ${
              hasOpenTasks
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-[#b41826] to-[#8a1219] text-white hover:from-[#a01522] hover:to-[#7a1017]'
            }`}
          >
            <PlusCircle className={`w-16 h-16 mb-4 transition-transform duration-300 ${
              hasOpenTasks ? '' : 'group-hover:scale-110'
            }`} />
            <h3 className="text-xl font-semibold mb-2">Nueva Tarea</h3>
            <p className="text-sm text-center opacity-90">
              {hasOpenTasks ? 'Finaliza tu tarea actual primero' : 'Crear una nueva tarea de producción'}
            </p>
          </button>

          <button
            onClick={onViewOrders}
            className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 group"
          >
            <ClipboardList className="w-16 h-16 mb-4 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="text-xl font-semibold mb-2">Ver Tareas</h3>
            <p className="text-sm text-center opacity-90">
              Gestionar tareas existentes
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}