import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, addDays, addWeeks } from 'date-fns';

// Event listeners for schedule updates
const scheduleUpdateListeners = new Set<() => void>();

export const subscribeToScheduleUpdates = (callback: () => void) => {
  scheduleUpdateListeners.add(callback);
  return () => scheduleUpdateListeners.delete(callback);
};

const notifyScheduleUpdate = () => {
  scheduleUpdateListeners.forEach(listener => listener());
};

export const triggerScheduleUpdate = () => {
  notifyScheduleUpdate();
};

export interface ScheduledWorkoutData {
  userId: string;
  workoutPlanId: string;
  dateTime: Date;
  recurrence?: 'none' | 'daily' | 'weekly' | 'custom';
  reminderMinutes?: number;
  customDays?: string[]; // ['monday', 'wednesday', 'friday']
}

export interface ScheduledWorkoutRecord {
  scheduleId: string;
  workoutId: string;
  dateTimeISO: string;
  timezone: string;
  recurrence: string;
  reminderMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

const STORAGE_KEY = 'nexfit-scheduled-workouts';

class ScheduleService {
  // Persistência local
  private getLocalSchedules(): ScheduledWorkoutRecord[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveLocalSchedules(schedules: ScheduledWorkoutRecord[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  }

  // Agendar treino
  async scheduleWorkout(data: ScheduledWorkoutData): Promise<{ success: boolean; scheduleId?: string; error?: string }> {
    try {
      const scheduleId = crypto.randomUUID();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Salvar localmente primeiro
      const localSchedules = this.getLocalSchedules();
      const newSchedule: ScheduledWorkoutRecord = {
        scheduleId,
        workoutId: data.workoutPlanId,
        dateTimeISO: data.dateTime.toISOString(),
        timezone,
        recurrence: data.recurrence || 'none',
        reminderMinutes: data.reminderMinutes || 30,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      };
      localSchedules.push(newSchedule);
      this.saveLocalSchedules(localSchedules);

      // Criar agendamentos no banco (com recorrência)
      const schedulesToCreate = this.generateRecurringSchedules(data);
      
      const { error } = await supabase
        .from('workout_schedule')
        .insert(schedulesToCreate.map(s => ({
          user_id: data.userId,
          workout_plan_id: data.workoutPlanId,
          scheduled_date: format(s.date, 'yyyy-MM-dd'),
          scheduled_time: format(s.date, 'HH:mm'),
          completed: false
        })));

      if (error) throw error;

      // Notify listeners
      notifyScheduleUpdate();

      // Telemetria
      console.log('[TELEMETRY] workout_scheduled', {
        workoutId: data.workoutPlanId,
        userId: data.userId,
        recurrence: data.recurrence,
        timestamp: new Date().toISOString()
      });

      return { success: true, scheduleId };
    } catch (error: any) {
      console.error('Error scheduling workout:', error);
      return { success: false, error: error.message };
    }
  }

  // Gerar datas de recorrência
  private generateRecurringSchedules(data: ScheduledWorkoutData): { date: Date }[] {
    const schedules: { date: Date }[] = [{ date: data.dateTime }];

    if (data.recurrence === 'daily') {
      // Próximos 30 dias
      for (let i = 1; i <= 30; i++) {
        schedules.push({ date: addDays(data.dateTime, i) });
      }
    } else if (data.recurrence === 'weekly') {
      // Próximas 12 semanas
      for (let i = 1; i <= 12; i++) {
        schedules.push({ date: addWeeks(data.dateTime, i) });
      }
    } else if (data.recurrence === 'custom' && data.customDays) {
      // Próximas 8 semanas nos dias específicos
      const dayMap: { [key: string]: number } = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6
      };
      
      for (let week = 0; week < 8; week++) {
        data.customDays.forEach(day => {
          const targetDay = dayMap[day];
          const currentDay = data.dateTime.getDay();
          let daysToAdd = targetDay - currentDay;
          if (daysToAdd < 0) daysToAdd += 7;
          daysToAdd += (week * 7);
          
          if (daysToAdd > 0) {
            schedules.push({ date: addDays(data.dateTime, daysToAdd) });
          }
        });
      }
    }

    return schedules;
  }

  // Editar agendamento
  async rescheduleWorkout(
    scheduleId: string,
    newDateTime: Date,
    reminderMinutes?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Atualizar local
      const localSchedules = this.getLocalSchedules();
      const index = localSchedules.findIndex(s => s.scheduleId === scheduleId);
      if (index >= 0) {
        localSchedules[index].dateTimeISO = newDateTime.toISOString();
        if (reminderMinutes !== undefined) {
          localSchedules[index].reminderMinutes = reminderMinutes;
        }
        this.saveLocalSchedules(localSchedules);
      }

      // Atualizar no banco
      const { error } = await supabase
        .from('workout_schedule')
        .update({
          scheduled_date: format(newDateTime, 'yyyy-MM-dd'),
          scheduled_time: format(newDateTime, 'HH:mm')
        })
        .eq('id', scheduleId);

      if (error) throw error;

      console.log('[TELEMETRY] workout_rescheduled', { scheduleId, newDateTime });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Cancelar agendamento
  async cancelWorkout(scheduleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Atualizar local
      const localSchedules = this.getLocalSchedules();
      const updated = localSchedules.map(s =>
        s.scheduleId === scheduleId ? { ...s, status: 'cancelled' as const } : s
      );
      this.saveLocalSchedules(updated);

      // Deletar do banco
      const { error } = await supabase
        .from('workout_schedule')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      console.log('[TELEMETRY] workout_canceled', { scheduleId });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Verificar conflitos de horário
  async checkConflicts(userId: string, dateTime: Date): Promise<{ hasConflict: boolean; suggestions?: Date[] }> {
    try {
      const targetDate = format(dateTime, 'yyyy-MM-dd');
      const targetTime = format(dateTime, 'HH:mm');

      const { data, error } = await supabase
        .from('workout_schedule')
        .select('scheduled_time')
        .eq('user_id', userId)
        .eq('scheduled_date', targetDate)
        .eq('completed', false);

      if (error) throw error;

      const hasConflict = data?.some(s => {
        if (!s.scheduled_time) return false;
        const scheduledTime = parseISO(`2000-01-01T${s.scheduled_time}`).getTime();
        const targetDateTime = parseISO(`2000-01-01T${targetTime}`).getTime();
        const diff = Math.abs(scheduledTime - targetDateTime);
        return diff < 3600000; // Menos de 1 hora de diferença
      }) || false;

      if (hasConflict) {
        // Sugerir horários alternativos
        const suggestions = [
          addDays(dateTime, 0).setHours(dateTime.getHours() + 2),
          addDays(dateTime, 1),
          addDays(dateTime, 0).setHours(dateTime.getHours() - 2)
        ].map(ms => new Date(ms));

        return { hasConflict: true, suggestions };
      }

      return { hasConflict: false };
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return { hasConflict: false };
    }
  }

  // Sincronizar offline → online
  async syncSchedules(userId: string): Promise<void> {
    const localSchedules = this.getLocalSchedules();
    const unsynced = localSchedules.filter(s => s.status === 'scheduled');

    for (const schedule of unsynced) {
      try {
        const date = parseISO(schedule.dateTimeISO);
        await supabase
          .from('workout_schedule')
          .upsert({
            id: schedule.scheduleId,
            user_id: userId,
            workout_plan_id: schedule.workoutId,
            scheduled_date: format(date, 'yyyy-MM-dd'),
            scheduled_time: format(date, 'HH:mm'),
            completed: schedule.status === 'completed'
          });
      } catch (error) {
        console.error('Error syncing schedule:', error);
      }
    }
  }
}

export const scheduleService = new ScheduleService();
