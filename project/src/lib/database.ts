import { supabase } from './supabase';

export interface ManufacturingOrder {
  id: string;
  manufacturing_number: string;
  current_stage: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  stages: string[];
}

export interface StageTime {
  id: string;
  order_id: string;
  stage: string;
  time_ms: number;
  created_at: string;
  user_id: string;
}

export async function createManufacturingOrder(
  manufacturingNumber: string,
  stages: string[]
): Promise<ManufacturingOrder> {
  if (!manufacturingNumber?.trim()) {
    throw new Error('El número de fabricación es requerido');
  }

  if (!stages?.length) {
    throw new Error('Debes seleccionar al menos una etapa');
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('No se ha podido autenticar. Por favor, inicie sesión de nuevo.');
  }

  try {
    // Check if manufacturing number already exists
    const { data: existingOrders, error: checkError } = await supabase
      .from('manufacturing_orders')
      .select('id')
      .eq('manufacturing_number', manufacturingNumber.trim());

    if (checkError) {
      console.error('Error checking existing orders:', checkError);
      throw new Error('Error al verificar el número de fabricación');
    }
    
    if (existingOrders && existingOrders.length > 0) {
      throw new Error('Este número de fabricación ya existe');
    }

    const { data, error } = await supabase
      .from('manufacturing_orders')
      .insert([
        {
          manufacturing_number: manufacturingNumber.trim(),
          current_stage: stages[0],
          stages: stages,
          user_id: session.user.id
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      if (error.code === '23505') { // Unique violation
        throw new Error('Este número de fabricación ya existe');
      }
      throw new Error('Error al crear la orden de fabricación');
    }

    if (!data) {
      throw new Error('No se pudo crear la orden de fabricación');
    }
    
    return data;
  } catch (error: any) {
    // Log the error for debugging
    console.error('Create order error:', error);
    
    // Handle specific error cases
    if (error.message?.includes('duplicate key value') || 
        error.message?.includes('ya existe')) {
      throw new Error('Este número de fabricación ya existe');
    }
    
    // Re-throw the error with a user-friendly message
    throw new Error(error.message || 'Error al crear la orden de fabricación');
  }
}

export async function updateManufacturingOrderStage(
  orderId: string,
  stage: string
): Promise<void> {
  const { error } = await supabase
    .from('manufacturing_orders')
    .update({ current_stage: stage, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) throw error;
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

  // First, check if there's already a time recorded for this stage and order
  const { data: existingTimes, error: checkError } = await supabase
    .from('stage_times')
    .select('*')
    .eq('order_id', orderId)
    .eq('stage', stage);

  if (checkError) throw checkError;

  // If a time already exists for this stage, update it
  if (existingTimes && existingTimes.length > 0) {
    const { error: updateError } = await supabase
      .from('stage_times')
      .update({ 
        time_ms: timeMs,
        user_id: session.user.id 
      })
      .eq('order_id', orderId)
      .eq('stage', stage);

    if (updateError) throw updateError;
  } else {
    // If no time exists, create a new one
    const { error: insertError } = await supabase
      .from('stage_times')
      .insert([{ 
        order_id: orderId, 
        stage, 
        time_ms: timeMs,
        user_id: session.user.id 
      }]);

    if (insertError) throw insertError;
  }
}

export async function getManufacturingOrders(): Promise<ManufacturingOrder[]> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('No se ha podido autenticar. Por favor, inicie sesión de nuevo.');
  }

  const { data, error } = await supabase
    .from('manufacturing_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAllStageTimes(): Promise<Record<string, { total: number, stages: Record<string, number> }>> {
  const { data, error } = await supabase
    .from('stage_times')
    .select(`
      id,
      order_id,
      stage,
      time_ms
    `);

  if (error) throw error;

  const result: Record<string, { total: number, stages: Record<string, number> }> = {};

  // Process each time record
  data.forEach(time => {
    if (!result[time.order_id]) {
      result[time.order_id] = {
        total: 0,
        stages: {
          sticker: 0,
          cutting: 0,
          assembly: 0,
          packaging: 0
        }
      };
    }

    // Store the time for this stage
    result[time.order_id].stages[time.stage] = time.time_ms;
  });

  // Calculate totals after all stages are processed
  Object.keys(result).forEach(orderId => {
    result[orderId].total = Object.values(result[orderId].stages)
      .reduce((sum, time) => sum + (time || 0), 0);
  });

  return result;
}

export async function deleteAllManufacturingOrders(): Promise<void> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('No se ha podido autenticar. Por favor, inicie sesión de nuevo.');
  }

  // First, get all order IDs
  const { data: orders, error: ordersError } = await supabase
    .from('manufacturing_orders')
    .select('id');

  if (ordersError) throw ordersError;

  if (!orders || orders.length === 0) return;

  const orderIds = orders.map(order => order.id);

  // Delete all stage times for these orders first (due to foreign key constraint)
  const { error: stageTimesError } = await supabase
    .from('stage_times')
    .delete()
    .in('order_id', orderIds);

  if (stageTimesError) throw stageTimesError;

  // Then delete all manufacturing orders
  const { error: ordersDeleteError } = await supabase
    .from('manufacturing_orders')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (ordersDeleteError) throw ordersDeleteError;
}