import type { TaskState } from '../types';

const TIMER_STATES_KEY = 'mmr_timer_states';

export function saveTimerStates(states: Record<string, TaskState>): void {
  localStorage.setItem(TIMER_STATES_KEY, JSON.stringify(states));
}

export function loadTimerStates(): Record<string, TaskState> {
  const savedStates = localStorage.getItem(TIMER_STATES_KEY);
  if (!savedStates) return {};

  try {
    const states = JSON.parse(savedStates);
    
    // Convert saved dates back to numbers
    (Object.values(states) as TaskState[]).forEach((state) => {
      if (state.startTime) {
        state.startTime = Number(state.startTime);
      }
      state.pausedTime = Number(state.pausedTime);
      state.elapsedTime = Number(state.elapsedTime);
      state.completedStages = new Set(state.completedStages);
    });

    return states;
  } catch (error) {
    console.error('Error loading timer states:', error);
    return {};
  }
}