import { supabase } from './supabase';

export interface ManufacturingOrder {
  id: string;
  manufacturing_number: string;
  current_stage: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  user_id: string;
  stages: string[];
  has_incidents?: boolean;
  incident_description?: string;
  profile?: {
    name: string;
    email: string;
  };
}

export interface StageTime {
  id: string;
  order_id: string;
  stage: string;
  time_ms: number;
  created_at: string;
  user_id: string;
  profile?: {
    name: string;
    email: string;
  };
}

// Función para generar el número de tarea con contador
async function generateTaskNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Obtener todas las tareas del día actual para calcular el siguiente número
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
  
  const { data: todaysTasks, error } = await supabase
    .from('manufacturing_orders')
    .select('manufacturing_number')
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay)
    .like('manufacturing_number', `Tarea_%_${year}${month}${day}`);

  if (error) {
    console.error('Error fetching today\'s tasks:', error);
    throw new Error('Error al generar el número de tarea');
  }

  // Encontrar el número más alto usado hoy
  let maxNumber = 0;
  if (todaysTasks) {
    todaysTasks.forEach(task => {
      const match = task.manufacturing_number.match(/Tarea_(\d+)_/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });
  }

  // Generar el siguiente número
  const nextNumber = (maxNumber + 1).toString().padStart(2, '0');
  return `Tarea_${nextNumber}_${year}${month}${day}`;
}

export async function createManufacturingOrder(
  manufacturingNumber: string,
  stages: string[]
): Promise<ManufacturingOrder> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('No se ha podido autenticar. Por favor, inicie sesión de nuevo.');
  }

  try {
    // Si el número empieza con "SIN-", generar un número de tarea con el formato correcto
    const finalNumber = manufacturingNumber.startsWith('SIN-') 
      ? await generateTaskNumber()
      : manufacturingNumber.trim();

    // Verificar si el número ya existe
    const { data: existingOrder, error: checkError } = await supabase
      .from('manufacturing_orders')
      .select('id')
      .eq('manufacturing_number', finalNumber)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing order:', checkError);
      throw new Error('Error al verificar el número de fabricación');
    }

    if (existingOrder) {
      throw new Error('Este número de fabricación ya existe');
    }

    // Crear la nueva orden
    const { data, error: insertError } = await supabase
      .from('manufacturing_orders')
      .insert([
        {
          manufacturing_number: finalNumber,
          current_stage: stages[0],
          stages: stages,
          user_id: session.user.id
        }
      ])
      .select(`
        *,
        profile:profiles (
          name,
          email
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating order:', insertError);
      throw new Error('Error al crear la orden de fabricación');
    }

    if (!data) {
      throw new Error('No se pudo crear la orden de fabricación');
    }

    return data;
  } catch (error: any) {
    console.error('Error in createManufacturingOrder:', error);
    throw error;
  }
}

export async function updateManufacturingOrderStage(
  orderId: string,
  stage: string,
  hasIncidents: boolean = false,
  incidentDescription?: string
): Promise<void> {
  const updates: any = { 
    current_stage: stage,
    updated_at: new Date().toISOString()
  };

  if (stage === 'summary') {
    updates.completed_at = new Date().toISOString();
    updates.has_incidents = hasIncidents;
    if (incidentDescription) {
      updates.incident_description = incidentDescription;
    }
  }

  const { error } = await supabase
    .from('manufacturing_orders')
    .update(updates)
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order stage:', error);
    throw error;
  }
}

export async function saveStageTime(
  orderId: string,
  stage: string,
  timeMs: number
): Promise<void> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('No se ha podido autenticar. Por favor, inicie sesión de nuevo.');
  }

  const { error } = await supabase
    .from('stage_times')
    .insert([{ 
      order_id: orderId, 
      stage, 
      time_ms: timeMs,
      user_id: session.user.id 
    }]);

  if (error) {
    console.error('Error saving stage time:', error);
    throw error;
  }
}

export async function getManufacturingOrders(): Promise<ManufacturingOrder[]> {
  const { data, error } = await supabase
    .from('manufacturing_orders')
    .select(`
      *,
      profile:profiles (
        name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }

  return data || [];
}

export async function getAllStageTimes(): Promise<Record<string, { total: number, stages: Record<string, number>, users: Record<string, string> }>> {
  const { data: stageTimes, error } = await supabase
    .from('stage_times')
    .select(`
      id,
      order_id,
      stage,
      time_ms,
      user_id,
      profile:profiles (
        name,
        email
      )
    `);

  if (error) {
    console.error('Error fetching stage times:', error);
    throw error;
  }

  const result: Record<string, { total: number, stages: Record<string, number>, users: Record<string, string> }> = {};

  stageTimes.forEach((time: any) => {
    if (!result[time.order_id]) {
      result[time.order_id] = {
        total: 0,
        stages: {
          assembly: 0
        },
        users: {}
      };
    }

    result[time.order_id].stages[time.stage] = time.time_ms;
    const userName = time.profile?.name || time.profile?.email?.split('@')[0] || 'Usuario desconocido';
    result[time.order_id].users[time.stage] = userName;
  });

  Object.keys(result).forEach(orderId => {
    result[orderId].total = Object.values(result[orderId].stages)
      .reduce((sum, time) => sum + (time || 0), 0);
  });

  return result;
}

export async function deleteManufacturingOrder(orderId: string): Promise<void> {
  const { error: stageTimesError } = await supabase
    .from('stage_times')
    .delete()
    .eq('order_id', orderId);

  if (stageTimesError) {
    console.error('Error deleting stage times:', stageTimesError);
    throw stageTimesError;
  }

  const { error: orderError } = await supabase
    .from('manufacturing_orders')
    .delete()
    .eq('id', orderId);

  if (orderError) {
    console.error('Error deleting order:', orderError);
    throw orderError;
  }
}

export async function deleteAllManufacturingOrders(): Promise<void> {
  const { data: orders, error: ordersError } = await supabase
    .from('manufacturing_orders')
    .select('id');

  if (ordersError) {
    console.error('Error fetching orders for deletion:', ordersError);
    throw ordersError;
  }

  if (!orders || orders.length === 0) return;

  const orderIds = orders.map(order => order.id);

  const { error: stageTimesError } = await supabase
    .from('stage_times')
    .delete()
    .in('order_id', orderIds);

  if (stageTimesError) {
    console.error('Error deleting stage times:', stageTimesError);
    throw stageTimesError;
  }

  const { error: ordersDeleteError } = await supabase
    .from('manufacturing_orders')
    .delete()
    .in('id', orderIds);

  if (ordersDeleteError) {
    console.error('Error deleting orders:', ordersDeleteError);
    throw ordersDeleteError;
  }
}

export async function updateManufacturingNumber(
  orderId: string,
  newNumber: string
): Promise<void> {
  if (!newNumber?.trim()) {
    throw new Error('El número de fabricación es requerido');
  }

  const { error } = await supabase
    .from('manufacturing_orders')
    .update({ 
      manufacturing_number: newNumber.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating manufacturing number:', error);
    if (error.code === '23505') {
      throw new Error('Este número de fabricación ya existe');
    }
    throw new Error('Error al actualizar el número de fabricación');
  }
}