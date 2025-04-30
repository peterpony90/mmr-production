import { useState } from 'react';
import { X } from 'lucide-react';

const incidentOptions = [
  'Alojamiento tapas ebike',
  'Asiento pinza de freno',
  'Asiento rodamiento de dirección',
  'Holgura basculante',
  'Incidencias portabidón',
  'Pintura',
  'Tolerancias namepivot',
  'Otros'
];

interface IncidentsDialogProps {
  onConfirm: (hasIncidents: boolean, description?: string) => void;
  onClose: () => void;
}

export function IncidentsDialog({ onConfirm, onClose }: IncidentsDialogProps) {
  const [showDescription, setShowDescription] = useState(false);
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);

  const handleConfirm = (hasIncidents: boolean) => {
    if (!hasIncidents) {
      onConfirm(false);
    } else {
      setShowDescription(true);
    }
  };

  const handleSubmitDescription = () => {
    onConfirm(true, selectedIncidents.join(', '));
  };

  const toggleIncident = (incident: string) => {
    setSelectedIncidents(prev => 
      prev.includes(incident)
        ? prev.filter(i => i !== incident)
        : [...prev, incident]
    );
  };

  if (showDescription) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Seleccionar incidencias
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                {incidentOptions.map(incident => (
                  <label key={incident} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedIncidents.includes(incident)}
                      onChange={() => toggleIncident(incident)}
                      className="rounded border-gray-300 text-[#b41826] focus:ring-[#b41826]"
                    />
                    <span className="text-gray-700">{incident}</span>
                  </label>
                ))}
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
                  onClick={handleSubmitDescription}
                  disabled={selectedIncidents.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#b41826] rounded-md hover:bg-[#a01522] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Confirmar finalización
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-6">
            ¿Se han identificado incidencias durante el proceso?
          </p>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => handleConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              No
            </button>
            <button
              onClick={() => handleConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#b41826] rounded-md hover:bg-[#a01522]"
            >
              Sí
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}