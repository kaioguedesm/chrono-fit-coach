import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface NotificationSettings {
  enabled: boolean;
  waterReminders: {
    enabled: boolean;
    interval: number; // minutos
    startTime: string; // "08:00"
    endTime: string; // "22:00"
  };
  workoutReminders: {
    enabled: boolean;
    time: string; // "07:00"
    days: string[]; // ["monday", "wednesday", "friday"]
  };
  mealReminders: {
    enabled: boolean;
    breakfast: string; // "08:00"
    lunch: string; // "12:00"
    snack: string; // "16:00"
    dinner: string; // "19:00"
  };
  motivationReminders: {
    enabled: boolean;
    time: string; // "09:00"
  };
  sleepReminder: {
    enabled: boolean;
    time: string; // "22:00"
  };
  weeklyWeighIn: {
    enabled: boolean;
    day: string; // "sunday"
    time: string; // "08:00"
  };
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  waterReminders: {
    enabled: true,
    interval: 120, // 2 horas
    startTime: "08:00",
    endTime: "22:00"
  },
  workoutReminders: {
    enabled: true,
    time: "07:00",
    days: ["monday", "wednesday", "friday"]
  },
  mealReminders: {
    enabled: true,
    breakfast: "08:00",
    lunch: "12:00",
    snack: "16:00",
    dinner: "19:00"
  },
  motivationReminders: {
    enabled: true,
    time: "09:00"
  },
  sleepReminder: {
    enabled: true,
    time: "22:00"
  },
  weeklyWeighIn: {
    enabled: true,
    day: "sunday",
    time: "08:00"
  }
};

const STORAGE_KEY = 'nexfit-notifications';

export const useNotifications = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  });
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (settings.enabled) {
      scheduleAllNotifications();
    }
  }, [settings]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "🎉 Notificações ativadas!",
          description: "Você receberá lembretes personalizados para alcançar suas metas."
        });
        return true;
      } else if (result === 'denied') {
        toast({
          title: "Permissão negada",
          description: "Você pode ativar notificações nas configurações do navegador.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
    return false;
  };

  const sendNotification = (title: string, body: string, icon?: string) => {
    if (permission !== 'granted' || !settings.enabled) return;

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'nexfit-notification',
        requireInteraction: false,
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close após 10 segundos
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  };

  const scheduleAllNotifications = () => {
    if (!settings.enabled || permission !== 'granted') return;

    // Limpar timers antigos
    clearAllTimers();

    // Agendar notificações de água
    if (settings.waterReminders.enabled) {
      scheduleWaterReminders();
    }

    // Agendar notificações de treino
    if (settings.workoutReminders.enabled) {
      scheduleWorkoutReminders();
    }

    // Agendar notificações de refeições
    if (settings.mealReminders.enabled) {
      scheduleMealReminders();
    }

    // Agendar notificação de motivação
    if (settings.motivationReminders.enabled) {
      scheduleMotivationReminder();
    }

    // Agendar notificação de sono
    if (settings.sleepReminder.enabled) {
      scheduleSleepReminder();
    }

    // Agendar pesagem semanal
    if (settings.weeklyWeighIn.enabled) {
      scheduleWeighInReminder();
    }
  };

  const scheduleWaterReminders = () => {
    const { interval, startTime, endTime } = settings.waterReminders;
    
    const waterMessages = [
      "💧 Hora de se hidratar! Beba um copo de água agora.",
      "🚰 Que tal uma pausa para água? Seu corpo agradece!",
      "💦 Mantenha-se hidratado! Beba água agora.",
      "🌊 Lembrete: Beba água para manter seu desempenho!",
      "💧 Hidratação é essencial! Hora de beber água."
    ];

    const checkWaterTime = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      if (currentTime >= startTime && currentTime <= endTime) {
        const randomMessage = waterMessages[Math.floor(Math.random() * waterMessages.length)];
        sendNotification("Nex Fit - Hidratação", randomMessage);
      }
    };

    // Agendar para cada intervalo
    const intervalMs = interval * 60 * 1000;
    const timerId = setInterval(checkWaterTime, intervalMs);
    (window as any).__nexfitTimers = (window as any).__nexfitTimers || [];
    (window as any).__nexfitTimers.push(timerId);
  };

  const scheduleWorkoutReminders = () => {
    const { time, days } = settings.workoutReminders;
    const [hours, minutes] = time.split(':').map(Number);

    const workoutMessages = [
      "🏋️ Hora do treino! Seus músculos estão te esperando.",
      "💪 Lembre-se: Nenhum treino é desperdiçado!",
      "🔥 Hora de superar seus limites! Vamos treinar?",
      "⚡ Seu corpo é capaz de coisas incríveis. Hora do treino!",
      "🎯 Foco no objetivo! Hora de treinar forte."
    ];

    const checkWorkoutTime = () => {
      const now = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = dayNames[now.getDay()];
      
      if (days.includes(currentDay) && now.getHours() === hours && now.getMinutes() === minutes) {
        const randomMessage = workoutMessages[Math.floor(Math.random() * workoutMessages.length)];
        sendNotification("Nex Fit - Hora do Treino!", randomMessage);
      }
    };

    const timerId = setInterval(checkWorkoutTime, 60000); // Verificar a cada minuto
    (window as any).__nexfitTimers = (window as any).__nexfitTimers || [];
    (window as any).__nexfitTimers.push(timerId);
  };

  const scheduleMealReminders = () => {
    const { breakfast, lunch, snack, dinner } = settings.mealReminders;
    
    const meals = [
      { time: breakfast, title: "Café da Manhã", emoji: "🍳", message: "Comece o dia com energia! Hora do café." },
      { time: lunch, title: "Almoço", emoji: "🍽️", message: "Hora de reabastecer! Não pule o almoço." },
      { time: snack, title: "Lanche", emoji: "🍎", message: "Hora de um lanche saudável!" },
      { time: dinner, title: "Jantar", emoji: "🥗", message: "Termine o dia com uma refeição equilibrada." }
    ];

    const checkMealTime = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      meals.forEach(meal => {
        if (currentTime === meal.time) {
          sendNotification(`Nex Fit - ${meal.title}`, `${meal.emoji} ${meal.message}`);
        }
      });
    };

    const timerId = setInterval(checkMealTime, 60000);
    (window as any).__nexfitTimers = (window as any).__nexfitTimers || [];
    (window as any).__nexfitTimers.push(timerId);
  };

  const scheduleMotivationReminder = () => {
    const { time } = settings.motivationReminders;
    const [hours, minutes] = time.split(':').map(Number);

    const motivationMessages = [
      "✨ Você é mais forte do que pensa! Continue focado.",
      "🌟 Cada dia é uma nova oportunidade de crescer!",
      "💫 Seus objetivos estão cada vez mais próximos!",
      "🚀 Acredite em você e no seu potencial!",
      "🌈 O sucesso é a soma de pequenos esforços diários!",
      "⭐ Você está no caminho certo! Continue assim!",
      "🎯 Mantenha o foco e a disciplina. Você consegue!",
      "💎 Transformação leva tempo. Seja paciente consigo mesmo."
    ];

    const checkMotivationTime = () => {
      const now = new Date();
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
        sendNotification("Nex Fit - Mensagem do Dia", randomMessage);
      }
    };

    const timerId = setInterval(checkMotivationTime, 60000);
    (window as any).__nexfitTimers = (window as any).__nexfitTimers || [];
    (window as any).__nexfitTimers.push(timerId);
  };

  const scheduleSleepReminder = () => {
    const { time } = settings.sleepReminder;
    const [hours, minutes] = time.split(':').map(Number);

    const checkSleepTime = () => {
      const now = new Date();
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        sendNotification(
          "Nex Fit - Hora de Descansar",
          "😴 O descanso é tão importante quanto o treino. Boa noite!"
        );
      }
    };

    const timerId = setInterval(checkSleepTime, 60000);
    (window as any).__nexfitTimers = (window as any).__nexfitTimers || [];
    (window as any).__nexfitTimers.push(timerId);
  };

  const scheduleWeighInReminder = () => {
    const { day, time } = settings.weeklyWeighIn;
    const [hours, minutes] = time.split(':').map(Number);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    const checkWeighInTime = () => {
      const now = new Date();
      const currentDay = dayNames[now.getDay()];
      
      if (currentDay === day && now.getHours() === hours && now.getMinutes() === minutes) {
        sendNotification(
          "Nex Fit - Pesagem Semanal",
          "⚖️ Hora de registrar seu progresso! Faça sua pesagem semanal."
        );
      }
    };

    const timerId = setInterval(checkWeighInTime, 60000);
    (window as any).__nexfitTimers = (window as any).__nexfitTimers || [];
    (window as any).__nexfitTimers.push(timerId);
  };

  const clearAllTimers = () => {
    const timers = (window as any).__nexfitTimers || [];
    timers.forEach((timer: number) => clearInterval(timer));
    (window as any).__nexfitTimers = [];
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const enableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      setSettings(prev => ({ ...prev, enabled: true }));
      return true;
    }
    return false;
  };

  const disableNotifications = () => {
    clearAllTimers();
    setSettings(prev => ({ ...prev, enabled: false }));
  };

  const testNotification = () => {
    sendNotification(
      "🎉 Teste de Notificação",
      "As notificações estão funcionando perfeitamente! Você receberá lembretes personalizados."
    );
  };

  return {
    settings,
    permission,
    updateSettings,
    enableNotifications,
    disableNotifications,
    requestPermission,
    testNotification,
    sendNotification
  };
};
