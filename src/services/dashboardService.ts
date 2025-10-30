import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export interface WorkoutCompletion {
  completionId: string;
  workoutId: string;
  userId: string;
  timestamp: string;
  duration?: number;
  syncStatus: 'pending' | 'synced';
}

export interface DashboardData {
  weeklyCount: number;
  weeklyTarget: number;
  progress: number;
  lastWorkout?: {
    timestamp: string;
    duration?: number;
    workoutName?: string;
  };
}

const STORAGE_KEY = 'nexfit-workout-completions';
const DASHBOARD_KEY = 'nexfit-dashboard-data';

class DashboardService {
  private eventListeners: Set<(data: DashboardData) => void> = new Set();

  // Persistência local
  private getLocalCompletions(): WorkoutCompletion[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveLocalCompletions(completions: WorkoutCompletion[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completions));
  }

  private getLocalDashboardData(): DashboardData | null {
    const stored = localStorage.getItem(DASHBOARD_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  private saveLocalDashboardData(data: DashboardData) {
    localStorage.setItem(DASHBOARD_KEY, JSON.stringify(data));
  }

  // Event listener para atualização em tempo real
  subscribe(callback: (data: DashboardData) => void) {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  private notifyListeners(data: DashboardData) {
    this.eventListeners.forEach(listener => listener(data));
  }

  // Calcular contagem semanal
  async computeWeeklyCount(userId: string): Promise<{ weeklyCount: number; weeklyTarget: number }> {
    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Segunda-feira
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .gte('completed_at', weekStart.toISOString())
        .lte('completed_at', weekEnd.toISOString());

      if (error) throw error;

      const weeklyCount = data?.length || 0;
      
      // Target padrão: 4 treinos/semana (pode ser customizado via perfil)
      const weeklyTarget = 4;

      return { weeklyCount, weeklyTarget };
    } catch (error) {
      console.error('Error computing weekly count:', error);
      return { weeklyCount: 0, weeklyTarget: 4 };
    }
  }

  // Calcular progresso
  computeProgress(weeklyCount: number, weeklyTarget: number): number {
    if (weeklyTarget === 0) return 0;
    return Math.min(Math.round((weeklyCount / weeklyTarget) * 100), 100);
  }

  // Buscar dados do dashboard
  async fetchDashboardData(userId: string): Promise<DashboardData> {
    try {
      // Buscar último treino
      const { data: lastWorkoutData } = await supabase
        .from('workout_sessions')
        .select(`
          completed_at,
          duration_minutes,
          workout_plan:workout_plans(name)
        `)
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { weeklyCount, weeklyTarget } = await this.computeWeeklyCount(userId);
      const progress = this.computeProgress(weeklyCount, weeklyTarget);

      const dashboardData: DashboardData = {
        weeklyCount,
        weeklyTarget,
        progress,
        lastWorkout: lastWorkoutData ? {
          timestamp: lastWorkoutData.completed_at,
          duration: lastWorkoutData.duration_minutes,
          workoutName: (lastWorkoutData.workout_plan as any)?.name
        } : undefined
      };

      // Salvar localmente
      this.saveLocalDashboardData(dashboardData);

      return dashboardData;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Retornar dados locais se houver erro
      return this.getLocalDashboardData() || {
        weeklyCount: 0,
        weeklyTarget: 4,
        progress: 0
      };
    }
  }

  // Evento: treino completado
  async handleWorkoutCompleted(data: {
    userId: string;
    workoutId: string;
    sessionId: string;
    duration?: number;
  }): Promise<void> {
    try {
      const completionId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      // Salvar localmente
      const localCompletions = this.getLocalCompletions();
      const newCompletion: WorkoutCompletion = {
        completionId,
        workoutId: data.workoutId,
        userId: data.userId,
        timestamp,
        duration: data.duration,
        syncStatus: 'pending'
      };
      localCompletions.push(newCompletion);
      this.saveLocalCompletions(localCompletions);

      // Atualizar dashboard local imediatamente
      const cachedData = this.getLocalDashboardData();
      if (cachedData) {
        cachedData.weeklyCount += 1;
        cachedData.progress = this.computeProgress(cachedData.weeklyCount, cachedData.weeklyTarget);
        cachedData.lastWorkout = {
          timestamp,
          duration: data.duration
        };
        this.saveLocalDashboardData(cachedData);
        this.notifyListeners(cachedData);
      }

      // Sincronizar com backend (assíncrono)
      this.syncCompletionToBackend(data.sessionId, data.userId);

      // Telemetria
      console.log('[TELEMETRY] workout_completed', {
        workoutId: data.workoutId,
        userId: data.userId,
        duration: data.duration,
        timestamp
      });
    } catch (error) {
      console.error('Error handling workout completed:', error);
    }
  }

  // Sincronizar conclusão com backend
  private async syncCompletionToBackend(sessionId: string, userId: string): Promise<void> {
    try {
      // Atualizar sessão com completed_at
      const { error } = await supabase
        .from('workout_sessions')
        .update({
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Marcar como sincronizado
      const localCompletions = this.getLocalCompletions();
      const updated = localCompletions.map(c =>
        c.syncStatus === 'pending' ? { ...c, syncStatus: 'synced' as const } : c
      );
      this.saveLocalCompletions(updated);

      // Atualizar dados do dashboard do backend
      const freshData = await this.fetchDashboardData(userId);
      this.notifyListeners(freshData);
    } catch (error) {
      console.error('Error syncing completion:', error);
      // Retentar após delay
      setTimeout(() => this.syncCompletionToBackend(sessionId, userId), 5000);
    }
  }

  // Sincronizar offline → online
  async syncPendingCompletions(userId: string): Promise<void> {
    const pending = this.getLocalCompletions().filter(c => c.syncStatus === 'pending');
    
    for (const completion of pending) {
      try {
        // Aqui você pode implementar lógica de dedupe por completionId
        // para evitar duplicação ao sincronizar
        await supabase
          .from('workout_sessions')
          .update({
            completed_at: completion.timestamp,
            duration_minutes: completion.duration
          })
          .eq('workout_plan_id', completion.workoutId)
          .eq('user_id', userId)
          .is('completed_at', null)
          .limit(1);

        // Marcar como sincronizado
        const localCompletions = this.getLocalCompletions();
        const updated = localCompletions.map(c =>
          c.completionId === completion.completionId ? { ...c, syncStatus: 'synced' as const } : c
        );
        this.saveLocalCompletions(updated);
      } catch (error) {
        console.error('Error syncing pending completion:', error);
      }
    }
  }

  // Limpar completions antigas (opcional, para não acumular muito)
  cleanupOldCompletions(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const completions = this.getLocalCompletions();
    const filtered = completions.filter(c => 
      new Date(c.timestamp) > cutoffDate
    );
    this.saveLocalCompletions(filtered);
  }
}

export const dashboardService = new DashboardService();
