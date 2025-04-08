import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Mail, Lock, LogOut, Play, Square, Timer, CheckCircle, ChevronRight, ClipboardList, Home } from 'lucide-react';
import { signIn, signUp, signOut, getSession } from './lib/auth';
import { createManufacturingOrder, updateManufacturingOrderStage, saveStageTime, getManufacturingOrders, getAllStageTimes, deleteAllManufacturingOrders } from './lib/database';
import type { AuthError } from './lib/auth';
import type { Session } from '@supabase/supabase-js';
import type { ManufacturingOrder } from './lib/database';
import { ManufacturingOrdersList } from './components/ManufacturingOrdersList';
import { MainMenu } from './components/MainMenu';

type Stage = 'assembly' | 'summary';
type View = 'menu' | 'new-order' | 'view-orders' | 'production';

interface StageTime {
  assembly: number;
}

interface StageInfo {
  title: string;
  nextStage?: Stage;
  nextButtonText?: string;
}

const stageConfig: Record<Stage, StageInfo> = {
  assembly: {
    title: 'Montaje',
    nextStage: 'summary',
    nextButtonText: 'Finalizar'
  },
  summary: {
    title: 'Resumen'
  }
};

function App() {
  const manufacturingNumberRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentView, setCurrentView] = useState<View>('menu');
  const [manufacturingNumber, setManufacturingNumber] = useState('');
  const [currentStage, setCurrentStage] = useState<Stage>('assembly');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [stageTimes, setStageTimes] = useState<StageTime>({
    assembly: 0
  });
  const [completedStages, setCompletedStages] = useState<Set<Stage>>(new Set());
  const [currentOrder, setCurrentOrder] = useState<ManufacturingOrder | null>(null);
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [totalTimes, setTotalTimes] = useState<Record<string, { total: number, stages: Record<string, number>, users: Record<string, string> }>>({});

  useEffect(() => {
    getSession().then(setSession).catch(console.error);
  }, []);

  useEffect(() => {
    if (session) {
      loadOrders();
    }
  }, [session]);

  useEffect(() => {
    let intervalId: number;
    if (isTimerRunning && startTime !== null) {
      intervalId = window.setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 10);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isTimerRunning, startTime]);

  useEffect(() => {
    if (currentView === 'new-order' && manufacturingNumberRef.current) {
      manufacturingNumberRef.current.focus();
    }
  }, [currentView]);

  const loadOrders = async () => {
    try {
      const [orders, times] = await Promise.all([
        getManufacturingOrders(),
        getAllStageTimes()
      ]);
      setOrders(orders);
      setTotalTimes(times);
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setError('¡Registro exitoso! Por favor, inicia sesión.');
        setIsSignUp(false);
      } else {
        const { session } = await signIn(email, password);
        setSession(session);
      }
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setSession(null);
      setCurrentView('menu');
      setCurrentOrder(null);
      setCurrentStage('assembly');
      setIsTimerRunning(false);
      setElapsedTime(0);
      setStartTime(null);
      setStageTimes({
        assembly: 0
      });
      setCompletedStages(new Set());
    } catch (err: any) {
      console.error('Error al cerrar sesión:', err);
      setSession(null);
      setCurrentView('menu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      // Reset all times and states before creating new order
      setElapsedTime(0);
      setStartTime(null);
      setIsTimerRunning(false);
      setStageTimes({ assembly: 0 });
      setCompletedStages(new Set());
      
      const order = await createManufacturingOrder(manufacturingNumber, ['assembly']);
      setCurrentOrder(order);
      setCurrentStage('assembly');
      setCurrentView('production');
      await loadOrders();
    } catch (err: any) {
      if (err.message?.includes('duplicate key value')) {
        setFormError('Este número de fabricación ya existe. Por favor, use un número diferente.');
      } else {
        setFormError('Error al crear la orden. Por favor, inténtelo de nuevo.');
      }
      console.error('Error creating order:', err);
    }
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    if (!completedStages.has(currentStage)) {
      setIsTimerRunning(true);
      setStartTime(Date.now());
      setElapsedTime(0);
    }
  };

  const handleStopTimer = async () => {
    setIsTimerRunning(false);
    if (currentStage !== 'summary' && currentOrder && !completedStages.has(currentStage)) {
      const time = elapsedTime;
      setStageTimes(prev => ({
        ...prev,
        [currentStage]: time
      }));
      setCompletedStages(prev => new Set([...prev, currentStage]));
      await saveStageTime(currentOrder.id, currentStage, time);
      await loadOrders();
      
      // Automatically move to summary stage after stopping
      await handleStageChange('summary');
    }
  };

  const handleStageChange = async (newStage: Stage) => {
    if (currentOrder) {
      await updateManufacturingOrderStage(currentOrder.id, newStage);
      await loadOrders();
    }
    setCurrentStage(newStage);
    setIsTimerRunning(false);
    setElapsedTime(0);
    setStartTime(null);
  };

  const handleSelectOrder = (order: ManufacturingOrder) => {
    setCurrentOrder(order);
    setManufacturingNumber(order.manufacturing_number);
    setCurrentStage(order.current_stage as Stage);
    setCurrentView('production');

    if (totalTimes[order.id]) {
      setStageTimes({
        assembly: totalTimes[order.id].stages.assembly || 0
      });

      const completed = new Set<Stage>();
      if (totalTimes[order.id].stages.assembly > 0) {
        completed.add('assembly');
      }
      setCompletedStages(completed);
    }
  };

  const handleGoToMenu = () => {
    setCurrentOrder(null);
    setCurrentStage('assembly');
    setIsTimerRunning(false);
    setElapsedTime(0);
    setStartTime(null);
    setCurrentView('menu');
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllManufacturingOrders();
      await loadOrders();
    } catch (err) {
      console.error('Error deleting orders:', err);
      throw err;
    }
  };

  const getTotalTime = (): number => {
    return stageTimes.assembly;
  };

  const renderBreadcrumbs = () => {
    const stages: Stage[] = ['assembly', 'summary'];
    const currentIndex = stages.indexOf(currentStage);

    return (
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          {stages.map((stage, index) => {
            const isActive = index <= currentIndex;
            const isLast = index === stages.length - 1;

            return (
              <React.Fragment key={stage}>
                <li
                  className={`flex items-center ${
                    isActive
                      ? 'text-[#b41826] font-medium'
                      : 'text-gray-400'
                  }`}
                >
                  {stageConfig[stage].title}
                </li>
                {!isLast && (
                  <li className="flex items-center">
                    <ChevronRight className={`w-4 h-4 ${
                      isActive ? 'text-[#b41826]' : 'text-gray-400'
                    }`} />
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
    );
  };

  const renderSummaryScreen = () => {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-8 text-green-600">
            <CheckCircle className="w-16 h-16" />
          </div>
          
          <h1 className="text-3xl font-bold text-center mb-2">Orden Completada</h1>
          <h2 className="text-xl font-semibold text-center text-gray-600 mb-8">
            Número de fabricación: {manufacturingNumber}
          </h2>

          <div className="space-y-6">
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Tiempo Total: {formatTime(getTotalTime())}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Tiempo de Montaje
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Montaje:</span>
                <span className="font-mono">{formatTime(stageTimes.assembly)}</span>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={handleGoToMenu}
                className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <Home className="w-5 h-5" />
                Menú Principal
              </button>
              <button
                onClick={() => {
                  setCurrentOrder(null);
                  setCurrentStage('assembly');
                  setIsTimerRunning(false);
                  setStageTimes({
                    assembly: 0
                  });
                  setCompletedStages(new Set());
                  setElapsedTime(0);
                  setStartTime(null);
                  setCurrentView('new-order');
                }}
                className="flex items-center gap-2 px-6 py-3 text-white bg-[#b41826] rounded-md hover:bg-[#a01522]"
              >
                Nueva Fabricación
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStageContent = () => {
    if (currentStage === 'summary') {
      return renderSummaryScreen();
    }

    const currentStageConfig = stageConfig[currentStage];
    
    if (!currentStageConfig) return null;

    const isStageCompleted = completedStages.has(currentStage);

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-6">{currentStageConfig.title}</h2>
          
          <div className="mb-8">
            <div className="text-4xl font-mono text-center mb-6">
              <Timer className="inline-block w-8 h-8 mr-2 mb-1" />
              {formatTime(isStageCompleted ? stageTimes[currentStage] : elapsedTime)}
            </div>
            
            <div className="flex justify-center gap-4 mb-8">
              {!isStageCompleted && !isTimerRunning && (
                <button
                  onClick={handleStartTimer}
                  className="flex items-center gap-2 px-6 py-3 text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  <Play className="w-5 h-5" />
                  Iniciar
                </button>
              )}
              
              {!isStageCompleted && isTimerRunning && (
                <button
                  onClick={handleStopTimer}
                  className="flex items-center gap-2 px-6 py-3 text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  <Square className="w-5 h-5" />
                  Detener
                </button>
              )}

              {isStageCompleted && (
                <div className="text-green-600 font-medium flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Tiempo registrado
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-center gap-4">
                {currentStage === 'assembly' && isStageCompleted && (
                  <button
                    onClick={() => {
                      handleStopTimer();
                      handleStageChange('summary');
                    }}
                    className="flex items-center gap-2 px-6 py-3 text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Finalizar
                    <CheckCircle className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleGoToMenu}
                  className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <Home className="w-5 h-5" />
                  Menú Principal
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-2">Detalles</h3>
            <p className="text-sm text-gray-600">Número de fabricación: {manufacturingNumber}</p>
          </div>
        </div>
      </div>
    );
  };

  if (session) {
    if (currentView === 'production') {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                MMR Production Control
              </h1>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>

            {renderBreadcrumbs()}
            {renderStageContent()}
          </div>

          <footer className="bg-black text-gray-300 py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p>&copy; 2024 MMR Production Control. Todos los derechos reservados.</p>
            </div>
          </footer>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              MMR Production Control
            </h1>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>

          {currentView === 'menu' && (
            <MainMenu
              onNewOrder={() => setCurrentView('new-order')}
              onViewOrders={() => setCurrentView('view-orders')}
            />
          )}

          {currentView === 'new-order' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Nueva orden de fabricación
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="manufacturingNumber" className="block text-sm font-medium text-gray-700">
                      Número de fabricación
                    </label>
                    <div className="mt-1">
                      <input
                        ref={manufacturingNumberRef}
                        type="text"
                        id="manufacturingNumber"
                        value={manufacturingNumber}
                        onChange={(e) => setManufacturingNumber(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#b41826] focus:ring-[#b41826] sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className="text-red-600 text-sm">{formError}</div>
                  )}

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentView('menu')}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver
                    </button>

                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#b41826] hover:bg-[#a01522] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b41826]"
                    >
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {currentView === 'view-orders' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <button
                  onClick={() => setCurrentView('menu')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al menú
                </button>
              </div>

              <ManufacturingOrdersList
                orders={orders}
                onSelectOrder={handleSelectOrder}
                totalTimes={totalTimes}
                onDeleteAll={handleDeleteAll}
              />
            </div>
          )}
        </div>

        <footer className="bg-black text-gray-300 py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p>&copy; 2024 MMR Production Control. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleAuth}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#b41826] focus:border-[#b41826] focus:z-10 sm:text-sm"
                    placeholder="Correo electrónico"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#b41826] focus:border-[#b41826] focus:z-10 sm:text-sm"
                    placeholder="Contraseña"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#b41826] hover:bg-[#a01522] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b41826] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  'Cargando...'
                ) : (
                  <>
                    {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-sm text-[#b41826] hover:text-[#a01522]"
              >
                {isSignUp
                  ? '¿Ya tienes una cuenta? Inicia sesión'
                  : '¿No tienes una cuenta? Regístrate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;