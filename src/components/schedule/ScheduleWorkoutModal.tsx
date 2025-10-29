import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { scheduleService } from '@/services/scheduleService';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, Bell, Repeat, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScheduleWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduled?: () => void;
  preSelectedDate?: Date;
}

interface WorkoutPlan {
  id: string;
  name: string;
  type: string;
}

export function ScheduleWorkoutModal({ open, onOpenChange, onScheduled, preSelectedDate }: ScheduleWorkoutModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendNotification, permission } = useNotifications();
  
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(preSelectedDate || new Date());
  const [selectedTime, setSelectedTime] = useState('07:00');
  const [enableRecurrence, setEnableRecurrence] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'custom'>('weekly');
  const [customDays, setCustomDays] = useState<string[]>(['monday', 'wednesday', 'friday']);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [enableNotifications, setEnableNotifications] = useState(permission === 'granted');
  const [loading, setLoading] = useState(false);
  const [conflict, setConflict] = useState<{ hasConflict: boolean; suggestions?: Date[] }>({ hasConflict: false });

  const weekDays = [
    { value: 'monday', label: 'Seg' },
    { value: 'tuesday', label: 'Ter' },
    { value: 'wednesday', label: 'Qua' },
    { value: 'thursday', label: 'Qui' },
    { value: 'friday', label: 'Sex' },
    { value: 'saturday', label: 'Sáb' },
    { value: 'sunday', label: 'Dom' }
  ];

  useEffect(() => {
    if (open && user) {
      fetchWorkoutPlans();
    }
  }, [open, user]);

  useEffect(() => {
    if (preSelectedDate) {
      setSelectedDate(preSelectedDate);
    }
  }, [preSelectedDate]);

  useEffect(() => {
    if (selectedDate && selectedTime && user) {
      checkConflicts();
    }
  }, [selectedDate, selectedTime]);

  const fetchWorkoutPlans = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('workout_plans')
      .select('id, name, type')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (!error && data) {
      setWorkoutPlans(data);
      if (data.length > 0) {
        setSelectedWorkout(data[0].id);
      }
    }
  };

  const checkConflicts = async () => {
    if (!user) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes, 0, 0);

    const result = await scheduleService.checkConflicts(user.id, dateTime);
    setConflict(result);
  };

  const toggleDay = (day: string) => {
    setCustomDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSchedule = async () => {
    if (!user || !selectedWorkout) return;

    setLoading(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const dateTime = new Date(selectedDate);
      dateTime.setHours(hours, minutes, 0, 0);

      const result = await scheduleService.scheduleWorkout({
        userId: user.id,
        workoutPlanId: selectedWorkout,
        dateTime,
        recurrence: enableRecurrence ? recurrenceType : 'none',
        reminderMinutes: enableNotifications ? reminderMinutes : undefined,
        customDays: recurrenceType === 'custom' ? customDays : undefined
      });

      if (result.success) {
        toast({
          title: "✅ Treino agendado!",
          description: enableRecurrence
            ? `Treino agendado com recorrência ${recurrenceType === 'daily' ? 'diária' : recurrenceType === 'weekly' ? 'semanal' : 'personalizada'}.`
            : `Treino agendado para ${format(dateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`
        });

        if (enableNotifications && permission === 'granted') {
          sendNotification(
            "🎯 Treino agendado!",
            `Você receberá um lembrete ${reminderMinutes} minutos antes.`
          );
        }

        onScheduled?.();
        onOpenChange(false);
        resetForm();
      } else {
        toast({
          title: "Erro ao agendar",
          description: result.error || "Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível agendar o treino.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(new Date());
    setSelectedTime('07:00');
    setEnableRecurrence(false);
    setReminderMinutes(30);
    setConflict({ hasConflict: false });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Treino</DialogTitle>
          <DialogDescription>
            Configure data, horário e recorrência do seu treino
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seleção de Treino */}
          <div className="space-y-2">
            <Label>Treino</Label>
            <Select value={selectedWorkout} onValueChange={setSelectedWorkout}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um treino" />
              </SelectTrigger>
              <SelectContent>
                {workoutPlans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - {plan.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Horário */}
          <div className="space-y-2">
            <Label>Horário</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conflito de Horário */}
          {conflict.hasConflict && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Já existe um treino próximo a este horário. Horários sugeridos:
                {conflict.suggestions?.slice(0, 2).map((date, i) => (
                  <Button
                    key={i}
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(format(date, 'HH:mm'));
                    }}
                    className="ml-2"
                  >
                    {format(date, "dd/MM 'às' HH:mm")}
                  </Button>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Recorrência */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Repetir treino
              </Label>
              <Switch checked={enableRecurrence} onCheckedChange={setEnableRecurrence} />
            </div>

            {enableRecurrence && (
              <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                <Select value={recurrenceType} onValueChange={(v: any) => setRecurrenceType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="weekly">Semanalmente</SelectItem>
                    <SelectItem value="custom">Dias específicos</SelectItem>
                  </SelectContent>
                </Select>

                {recurrenceType === 'custom' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Dias da semana</Label>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map(day => (
                        <Badge
                          key={day.value}
                          variant={customDays.includes(day.value) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleDay(day.value)}
                        >
                          {day.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notificações */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Lembrete
              </Label>
              <Switch
                checked={enableNotifications}
                onCheckedChange={setEnableNotifications}
                disabled={permission !== 'granted'}
              />
            </div>

            {enableNotifications && (
              <div className="pl-6">
                <Select value={String(reminderMinutes)} onValueChange={(v) => setReminderMinutes(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos antes</SelectItem>
                    <SelectItem value="30">30 minutos antes</SelectItem>
                    <SelectItem value="60">1 hora antes</SelectItem>
                    <SelectItem value="120">2 horas antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {permission !== 'granted' && (
              <p className="text-xs text-muted-foreground pl-6">
                Ative as notificações nas configurações para receber lembretes
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSchedule} disabled={loading || !selectedWorkout} className="flex-1">
            {loading ? 'Agendando...' : 'Agendar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
