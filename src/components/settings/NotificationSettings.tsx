import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Bell, 
  BellOff, 
  Droplets, 
  Dumbbell, 
  Utensils, 
  Sparkles, 
  Moon, 
  Scale,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const NotificationSettings = () => {
  const { 
    settings, 
    permission, 
    updateSettings, 
    enableNotifications, 
    disableNotifications,
    testNotification 
  } = useNotifications();

  const [loading, setLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setLoading(true);
    await enableNotifications();
    setLoading(false);
  };

  const getPermissionBadge = () => {
    if (permission === 'granted') {
      return (
        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Ativado
        </Badge>
      );
    } else if (permission === 'denied') {
      return (
        <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Bloqueado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <AlertCircle className="w-3 h-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  const weekDays = [
    { value: 'monday', label: 'Seg' },
    { value: 'tuesday', label: 'Ter' },
    { value: 'wednesday', label: 'Qua' },
    { value: 'thursday', label: 'Qui' },
    { value: 'friday', label: 'Sex' },
    { value: 'saturday', label: 'Sáb' },
    { value: 'sunday', label: 'Dom' }
  ];

  const toggleWorkoutDay = (day: string) => {
    const currentDays = settings.workoutReminders.days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    updateSettings({
      workoutReminders: { ...settings.workoutReminders, days: newDays }
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {settings.enabled ? (
                  <Bell className="w-5 h-5 text-primary" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">Notificações Push</CardTitle>
                <CardDescription>
                  Receba lembretes personalizados no seu dispositivo
                </CardDescription>
              </div>
            </div>
            {getPermissionBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission !== 'granted' ? (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <p className="text-sm text-muted-foreground">
                Para receber notificações, você precisa permitir o acesso nas configurações do navegador.
              </p>
              <Button 
                onClick={handleEnableNotifications} 
                disabled={loading}
                className="w-full"
              >
                <Bell className="w-4 h-4 mr-2" />
                Ativar Notificações
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificações Ativas</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar ou desabilitar todos os lembretes
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => 
                    checked ? enableNotifications() : disableNotifications()
                  }
                />
              </div>
              <Button 
                variant="outline" 
                onClick={testNotification}
                disabled={!settings.enabled}
                className="w-full"
              >
                Testar Notificação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {settings.enabled && permission === 'granted' && (
        <>
          {/* Lembretes de Água */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-lg">Hidratação</CardTitle>
              </div>
              <CardDescription>
                Lembretes regulares para beber água
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ativar lembretes</Label>
                <Switch
                  checked={settings.waterReminders.enabled}
                  onCheckedChange={(checked) => 
                    updateSettings({
                      waterReminders: { ...settings.waterReminders, enabled: checked }
                    })
                  }
                />
              </div>
              {settings.waterReminders.enabled && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Intervalo (minutos)</Label>
                    <Select
                      value={settings.waterReminders.interval.toString()}
                      onValueChange={(value) => 
                        updateSettings({
                          waterReminders: { ...settings.waterReminders, interval: parseInt(value) }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">A cada 1 hora</SelectItem>
                        <SelectItem value="90">A cada 1h30</SelectItem>
                        <SelectItem value="120">A cada 2 horas</SelectItem>
                        <SelectItem value="180">A cada 3 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Início</Label>
                      <Input
                        type="time"
                        value={settings.waterReminders.startTime}
                        onChange={(e) => 
                          updateSettings({
                            waterReminders: { ...settings.waterReminders, startTime: e.target.value }
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fim</Label>
                      <Input
                        type="time"
                        value={settings.waterReminders.endTime}
                        onChange={(e) => 
                          updateSettings({
                            waterReminders: { ...settings.waterReminders, endTime: e.target.value }
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Lembretes de Treino */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-purple-500" />
                <CardTitle className="text-lg">Treino</CardTitle>
              </div>
              <CardDescription>
                Lembretes para não perder seus treinos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ativar lembretes</Label>
                <Switch
                  checked={settings.workoutReminders.enabled}
                  onCheckedChange={(checked) => 
                    updateSettings({
                      workoutReminders: { ...settings.workoutReminders, enabled: checked }
                    })
                  }
                />
              </div>
              {settings.workoutReminders.enabled && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Horário do treino</Label>
                    <Input
                      type="time"
                      value={settings.workoutReminders.time}
                      onChange={(e) => 
                        updateSettings({
                          workoutReminders: { ...settings.workoutReminders, time: e.target.value }
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dias da semana</Label>
                    <div className="flex gap-2 flex-wrap">
                      {weekDays.map(day => (
                        <Button
                          key={day.value}
                          variant={settings.workoutReminders.days.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleWorkoutDay(day.value)}
                          className="flex-1 min-w-[60px]"
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Lembretes de Refeições */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-lg">Refeições</CardTitle>
              </div>
              <CardDescription>
                Lembretes para suas refeições diárias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ativar lembretes</Label>
                <Switch
                  checked={settings.mealReminders.enabled}
                  onCheckedChange={(checked) => 
                    updateSettings({
                      mealReminders: { ...settings.mealReminders, enabled: checked }
                    })
                  }
                />
              </div>
              {settings.mealReminders.enabled && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>🍳 Café da manhã</Label>
                      <Input
                        type="time"
                        value={settings.mealReminders.breakfast}
                        onChange={(e) => 
                          updateSettings({
                            mealReminders: { ...settings.mealReminders, breakfast: e.target.value }
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>🍽️ Almoço</Label>
                      <Input
                        type="time"
                        value={settings.mealReminders.lunch}
                        onChange={(e) => 
                          updateSettings({
                            mealReminders: { ...settings.mealReminders, lunch: e.target.value }
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>🍎 Lanche</Label>
                      <Input
                        type="time"
                        value={settings.mealReminders.snack}
                        onChange={(e) => 
                          updateSettings({
                            mealReminders: { ...settings.mealReminders, snack: e.target.value }
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>🥗 Jantar</Label>
                      <Input
                        type="time"
                        value={settings.mealReminders.dinner}
                        onChange={(e) => 
                          updateSettings({
                            mealReminders: { ...settings.mealReminders, dinner: e.target.value }
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Motivação Diária */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <CardTitle className="text-lg">Motivação Diária</CardTitle>
              </div>
              <CardDescription>
                Receba mensagens motivacionais todos os dias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ativar lembretes</Label>
                <Switch
                  checked={settings.motivationReminders.enabled}
                  onCheckedChange={(checked) => 
                    updateSettings({
                      motivationReminders: { ...settings.motivationReminders, enabled: checked }
                    })
                  }
                />
              </div>
              {settings.motivationReminders.enabled && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={settings.motivationReminders.time}
                      onChange={(e) => 
                        updateSettings({
                          motivationReminders: { ...settings.motivationReminders, time: e.target.value }
                        })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Lembrete de Sono */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-500" />
                <CardTitle className="text-lg">Hora de Dormir</CardTitle>
              </div>
              <CardDescription>
                Lembrete para manter uma rotina de sono saudável
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ativar lembrete</Label>
                <Switch
                  checked={settings.sleepReminder.enabled}
                  onCheckedChange={(checked) => 
                    updateSettings({
                      sleepReminder: { ...settings.sleepReminder, enabled: checked }
                    })
                  }
                />
              </div>
              {settings.sleepReminder.enabled && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={settings.sleepReminder.time}
                      onChange={(e) => 
                        updateSettings({
                          sleepReminder: { ...settings.sleepReminder, time: e.target.value }
                        })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pesagem Semanal */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-green-500" />
                <CardTitle className="text-lg">Pesagem Semanal</CardTitle>
              </div>
              <CardDescription>
                Lembrete para acompanhar seu peso semanalmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ativar lembrete</Label>
                <Switch
                  checked={settings.weeklyWeighIn.enabled}
                  onCheckedChange={(checked) => 
                    updateSettings({
                      weeklyWeighIn: { ...settings.weeklyWeighIn, enabled: checked }
                    })
                  }
                />
              </div>
              {settings.weeklyWeighIn.enabled && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Dia da semana</Label>
                      <Select
                        value={settings.weeklyWeighIn.day}
                        onValueChange={(value) => 
                          updateSettings({
                            weeklyWeighIn: { ...settings.weeklyWeighIn, day: value }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sunday">Domingo</SelectItem>
                          <SelectItem value="monday">Segunda</SelectItem>
                          <SelectItem value="tuesday">Terça</SelectItem>
                          <SelectItem value="wednesday">Quarta</SelectItem>
                          <SelectItem value="thursday">Quinta</SelectItem>
                          <SelectItem value="friday">Sexta</SelectItem>
                          <SelectItem value="saturday">Sábado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Horário</Label>
                      <Input
                        type="time"
                        value={settings.weeklyWeighIn.time}
                        onChange={(e) => 
                          updateSettings({
                            weeklyWeighIn: { ...settings.weeklyWeighIn, time: e.target.value }
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
