import { ClipboardList, Wrench, ArrowLeft } from 'lucide-react';

interface NewOrderTypeSelectionProps {
  onSelectType: (type: 'with-number' | 'without-number') => void;
  onBack: () => void;
}

export function NewOrderTypeSelection({ onSelectType, onBack }: NewOrderTypeSelectionProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-xl font-semibold mb-6 text-center">
          Crear nueva tarea
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => onSelectType('with-number')}
            className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#b41826] to-[#8a1219] text-white rounded-lg hover:from-[#a01522] hover:to-[#7a1017] transition-all duration-300 group"
          >
            <ClipboardList className="w-16 h-16 mb-4 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="text-xl font-semibold mb-2">Insertar Orden de Fabricación</h3>
            <p className="text-sm text-center opacity-90">
              Crear una tarea con número de fabricación
            </p>
          </button>

          <button
            onClick={() => onSelectType('without-number')}
            className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 group"
          >
            <Wrench className="w-16 h-16 mb-4 group-hover:scale-110 transition-transform duration-300" />
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
