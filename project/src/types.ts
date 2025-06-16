export interface StageTime {
  assembly: number;
}

export interface TaskState {
  orderId: string;
  isTimerRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pausedTime: number;
  elapsedTime: number;
  stageTimes: StageTime;
  completedStages: Set<string>;
}