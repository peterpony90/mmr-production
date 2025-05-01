import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Mail, Lock, LogOut, Play, Square, Timer, CheckCircle, ChevronRight, ClipboardList, Home, Pause} from 'lucide-react';
import { signIn, signUp, signOut, getSession } from './lib/auth';
import { createManufacturingOrder, updateManufacturingOrderStage, saveStageTime, getManufacturingOrders, getAllStageTimes, deleteAllManufacturingOrders, updateManufacturingNumber } from './lib/database';
import type { AuthError } from './lib/auth';
import type { Session } from '@supabase/supabase-js';
import type { ManufacturingOrder } from './lib/database';
import { ManufacturingOrdersList } from './components/ManufacturingOrdersList';
import { MainMenu } from './components/MainMenu';
import { IncidentsDialog } from './components/IncidentsDialog';
import { EditOrderModal } from './components/EditOrderModal';
import { NewOrderTypeSelection } from './components/NewOrderTypeSelection';
import { TaskDescriptionDialog } from './components/TaskDescriptionDialog';

type Stage = 'assembly' | 'summary';
type View = 'menu' | 'new-order' | 'new-order-type' | 'view-orders' | 'production';
type OrderType = 'with-number' | 'without-number' | null;

interface StageTime {
  assembly: number;
}

interface StageInfo {
  title: string;
  nextStage?: Stage;
  nextButtonText?: string;
}

interface TaskState {
  orderId: string;
  isTimerRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pausedTime: number;
  elapsedTime: number;
  stageTimes: StageTime;
  completedStages: Set<Stage>;
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
  const [currentOrder, setCurrentOrder] = useState<ManufacturingOrder | null>(null);
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [totalTimes, setTotalTimes] = useState<Record<string, { total: number, stages: Record<string, number>, users: Record<string, string> }>>({});
  const [showIncidentsDialog, setShowIncidentsDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<ManufacturingOrder | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<OrderType>(null);
  const [showTaskDescriptionDialog, setShowTaskDescriptionDialog] = useState(false);
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({});

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
    
    // Only update the timer if we have a current order and its timer is running
    if (currentOrder && taskStates[currentOrder.id]?.isTimerRunning && !taskStates[currentOrder.id]?.isPaused) {
      intervalId = window.setInterval(() => {
        const state = taskStates[currentOrder.id];
        if (state && state.startTime !== null) {
          const newElapsedTime = Date.now() - state.startTime + state.pausedTime;
          setTaskStates(prev => ({
            ...prev,
            [currentOrder.id]: {
              ...prev[currentOrder.id],
              elapsedTime: newElapsedTime
            }
          }));
        }
      }, 10);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentOrder, taskStates]);

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
      setTaskStates({});
    } catch (err: any) {
      console.error('Error al cerrar sesión:', err);
      setSession(null);
      setCurrentView('menu');
    }
  };

  const initializeNewTaskState = (orderId: string): TaskState => ({
    orderId,
    isTimerRunning: false,
    isPaused: false,
    startTime: null,
    pausedTime: 0,
    elapsedTime: 0,
    stageTimes: { assembly: 0 },
    completedStages: new Set()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const order = await createManufacturingOrder(manufacturingNumber, ['assembly']);
      setCurrentOrder(order);
      setCurrentStage('assembly');
      setCurrentView('production');
      
      // Initialize new task state
      setTaskStates(prev => ({
        ...prev,
        [order.id]: initializeNewTaskState(order.id)
      }));
      
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
    if (!currentOrder) return;
    
    const state = taskStates[currentOrder.id];
    if (!state || state.completedStages.has(currentStage)) return;

    setTaskStates(prev => ({
      ...prev,
      [currentOrder.id]: {
        ...prev[currentOrder.id],
        isTimerRunning: true,
        isPaused: false,
        startTime: Date.now(),
        elapsedTime: prev[currentOrder.id].pausedTime
      }
    }));
  };

  const handlePauseTimer = () => {
    if (!currentOrder) return;
    
    const state = taskStates[currentOrder.id];
    if (!state || !state.isTimerRunning || state.isPaused) return;

    setTaskStates(prev => ({
      ...prev,
      [currentOrder.id]: {
        ...prev[currentOrder.id],
        isPaused: true,
        pausedTime: prev[currentOrder.id].elapsedTime
      }
    }));
  };

  const handleResumeTimer = () => {
    if (!currentOrder) return;
    
    const state = taskStates[currentOrder.id];
    if (!state || !state.isTimerRunning || !state.isPaused) return;

    setTaskStates(prev => ({
      ...prev,
      [currentOrder.id]: {
        ...prev[currentOrder.id],
        isPaused: false,
        startTime: Date.now()
      }
    }));
  };

  const handleNewOrder = () => {
    setManufacturingNumber('');
    setOrderType(null);
    setCurrentView('new-order-type');
  };

  const handleOrderTypeSelect = (type: 'with-number' | 'without-number') => {
    setOrderType(type);
    if (type === 'with-number') {
      setCurrentView('new-order');
    } else {
      handleStartWithoutNumber();
    }
  };

  const handleStartWithoutNumber = async () => {
    try {
      const timestamp = new Date().getTime();
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const generatedNumber = `SIN-${timestamp}-${randomSuffix}`;
      
      const order = await createManufacturingOrder(generatedNumber, ['assembly']);
      setCurrentOrder(order);
      setManufacturingNumber(generatedNumber);
      setCurrentStage('assembly');
      setCurrentView('production');
      
      // Initialize new task state
      setTaskStates(prev => ({
        ...prev,
        [order.id]: initializeNewTaskState(order.id)
      }));
      
      await loadOrders();
    } catch (err) {
      console.error('Error creating order without number:', err);
      setFormError('Error al crear la tarea. Por favor, inténtelo de nuevo.');
    }
  };

  const handleStopTimer = async () => {
    if (!currentOrder) return;
    
    const state = taskStates[currentOrder.id];
    if (!state) return;

    setTaskStates(prev => ({
      ...prev,
      [currentOrder.id]: {
        ...prev[currentOrder.id],
        isTimerRunning: false,
        isPaused: false
      }
    }));

    if (currentStage !== 'summary' && !state.completedStages.has(currentStage)) {
      const time = state.elapsedTime;
      
      setTaskStates(prev => ({
        ...prev,
        [currentOrder.id]: {
          ...prev[currentOrder.id],
          stageTimes: {
            ...prev[currentOrder.id].stageTimes,
            [currentStage]: time
          },
          completedStages: new Set([...prev[currentOrder.id].completedStages, currentStage])
        }
      }));

      await saveStageTime(currentOrder.id, currentStage, time);
      await loadOrders();
      
      if (orderType === 'with-number') {
        setShowIncidentsDialog(true);
      } else {
        setShowTaskDescriptionDialog(true);
      }
    }
  };

  const handleTaskDescriptionConfirm = async (description: string) => {
    setShowTaskDescriptionDialog(false);
    if (currentOrder) {
      await updateManufacturingOrderStage(currentOrder.id, 'summary', false, description);
      await loadOrders();
      setCurrentStage('summary');
    }
  };

  const handleIncidentsConfirm = async (hasIncidents: boolean, description?: string) => {
    setShowIncidentsDialog(false);
    if (currentOrder) {
      await updateManufacturingOrderStage(currentOrder.id, 'summary', hasIncidents, description);
      await loadOrders();
      setCurrentStage('summary');
    }
  };

  const handleEditOrder = (order: ManufacturingOrder) => {
    setSelectedOrderForEdit(order);
    setShowEditModal(true);
    setEditError(null);
  };

  const handleSaveEdit = async (orderId: string, newNumber: string) => {
    try {
      await updateManufacturingNumber(orderId, newNumber);
      setShowEditModal(false);
      setSelectedOrderForEdit(null);
      setEditError(null);
      await loadOrders();
    } catch (error: any) {
      setEditError(error.message);
    }
  };

  const handleSelectOrder = (order: ManufacturingOrder) => {
    setCurrentOrder(order);
    setManufacturingNumber(order.manufacturing_number);
    setCurrentStage(order.current_stage as Stage);
    setCurrentView('production');
    setOrderType(order.manufacturing_number.startsWith('SIN-') ? 'without-number' : 'with-number');

    // Initialize task state if it doesn't exist
    if (!taskStates[order.id]) {
      setTaskStates(prev => ({
        ...prev,
        [order.id]: initializeNewTaskState(order.id)
      }));
    }
  };

  const handleGoToMenu = () => {
    setCurrentView('menu');
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllManufacturingOrders();
      setTaskStates({});
      await loadOrders();
    } catch (err) {
      console.error('Error deleting orders:', err);
      throw err;
    }
  };

  const handleOrdersChanged = async () => {
    await loadOrders();
  };

  const getTotalTime = (): number => {
    if (!currentOrder || !taskStates[currentOrder.id]) return 0;
    return taskStates[currentOrder.id].stageTimes.assembly;
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

  const renderTimer = () => {
    if (!currentOrder || !taskStates[currentOrder.id]?.isTimerRunning || currentStage === 'summary') return null;

    const state = taskStates[currentOrder.id];

    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50">
        <div className="text-2xl font-mono mb-2">
          <Timer className="inline-block w-6 h-6 mr-2 mb-1" />
          {formatTime(state.elapsedTime)}
        </div>
        <div className="flex justify-center gap-2">
          {!state.isPaused ? (
            <button
              onClick={handlePauseTimer}
              className="px-3 py-1 text-sm text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
            >
              <Pause className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleResumeTimer}
              className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleStopTimer}
            className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderSummaryScreen = () => {
    if (!currentOrder || !taskStates[currentOrder.id]) {
      return null;
    }

    const state = taskStates[currentOrder.id];

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-8 text-green-600">
            <CheckCircle className="w-16 h-16" />
          </div>
          
          <h1 className="text-3xl font-bold text-center mb-2">Tarea Completada</h1>
          <h2 className="text-xl font-semibold text-center text-gray-600 mb-8">
            {orderType === 'with-number' ? 'Número de fabricación:' : 'Tarea sin número:'} {manufacturingNumber}
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
                <span className="font-mono">{formatTime(state.stageTimes.assembly)}</span>
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
                  setManufacturingNumber('');
                  setOrderType(null);
                  setCurrentView('new-order-type');
                }}
                className="flex items-center gap-2 px-6 py-3 text-white bg-[#b41826] rounded-md hover:bg-[#a01522]"
              >
                Nueva Tarea
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

    if (!currentOrder || !taskStates[currentOrder.id]) return null;

    const currentStageConfig = stageConfig[currentStage];
    if (!currentStageConfig) return null;

    const state = taskStates[currentOrder.id];
    const isStageCompleted = state.completedStages.has(currentStage);

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-6">{currentStageConfig.title}</h2>
          
          <div className="mb-8">
            <div className="text-4xl font-mono text-center mb-6">
              <Timer className="inline-block w-8 h-8 mr-2 mb-1" />
              {formatTime(isStageCompleted ? state.stageTimes[currentStage] : state.elapsedTime)}
            </div>
            
            <div className="flex justify-center gap-4 mb-8">
              {!isStageCompleted && !state.isTimerRunning && (
                <button
                  onClick={handleStartTimer}
                  className="flex items-center gap-2 px-6 py-3 text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  <Play className="w-5 h-5" />
                  Iniciar
                </button>
              )}
              
              {!isStageCompleted && state.isTimerRunning && (
                <>
                  {!state.isPaused ? (
                    <button
                      onClick={handlePauseTimer}
                      className="flex items-center gap-2 px-6 py-3 text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
                    >
                      <Pause className="w-5 h-5" />
                      Pausar
                    </button>
                  ) : (
                    <button
                      onClick={handleResumeTimer}
                      className="flex items-center gap-2 px-6 py-3 text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                      <Play className="w-5 h-5" />
                      Reanudar
                    </button>
                  )}
                  
                  <button
                    onClick={handleStopTimer}
                    className="flex items-center gap-2 px-6 py-3 text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    <Square className="w-5 h-5" />
                    Detener
                  </button>
                </>
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
                      if (orderType === 'with-number') {
                        setShowIncidentsDialog(true);
                      } else {
                        setShowTaskDescriptionDialog(true);
                      }
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
            <p className="text-sm text-gray-600">
              {orderType === 'with-number' ? 'Número de fabricación:' : 'Tarea sin número:'} {manufacturingNumber}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (!session) {
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

        {currentView === 'production' && renderBreadcrumbs()}

        {currentView === 'menu' && (
          <MainMenu
            onNewOrder={handleNewOrder}
            onViewOrders={() => setCurrentView('view-orders')}
          />
        )}

        {currentView === 'new-order-type' && (
          <NewOrderTypeSelection
            onSelectType={handleOrderTypeSelect}
            onBack={() => setCurrentView('menu')}
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
                    onClick={() => {
                      setManufacturingNumber('');
                      setCurrentView('new-order-type');
                    }}
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
                onClick={() => {
                  setManufacturingNumber('');
                  setCurrentView('menu');
                }}
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
              onOrdersChanged={handleOrdersChanged}
              onEditOrder={handleEditOrder}
            />
          </div>
        )}

        {currentView === 'production' && renderStageContent()}

        {showIncidentsDialog && (
          <IncidentsDialog
            onConfirm={handleIncidentsConfirm}
            onClose={() => setShowIncidentsDialog(false)}
          />
        )}

        {showEditModal && selectedOrderForEdit && (
          <EditOrderModal
            orderId={selectedOrderForEdit.id}
            currentNumber={selectedOrderForEdit.manufacturing_number}
            onSave={handleSaveEdit}
            onClose={() => {
              setShowEditModal(false);
              setSelectedOrderForEdit(null);
              setEditError(null);
            }}
            error={editError}
          />
        )}

        {showTaskDescriptionDialog && (
          <TaskDescriptionDialog
            onConfirm={handleTaskDescriptionConfirm}
            onClose={() => setShowTaskDescriptionDialog(false)}
          />
        )}

        {renderTimer()}
      </div>

      <footer className="bg-black text-gray-300 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 MMR Production Control. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
