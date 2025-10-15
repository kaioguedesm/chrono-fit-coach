import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smile, Meh, Frown, Zap, Battery } from 'lucide-react';

interface MoodOption {
  id: string;
  emoji: string;
  label: string;
  description: string;
  icon: typeof Smile;
  intensity: number;
}

const moodOptions: MoodOption[] = [
  {
    id: 'energized',
    emoji: '😃',
    label: 'Animado',
    description: 'Cheio de energia e pronto para um desafio!',
    icon: Zap,
    intensity: 5
  },
  {
    id: 'good',
    emoji: '🙂',
    label: 'Bem',
    description: 'Me sentindo bem e motivado',
    icon: Smile,
    intensity: 4
  },
  {
    id: 'neutral',
    emoji: '😐',
    label: 'Normal',
    description: 'Não muito animado, mas vou fazer',
    icon: Meh,
    intensity: 3
  },
  {
    id: 'tired',
    emoji: '😪',
    label: 'Cansado',
    description: 'Um pouco cansado, preciso de algo leve',
    icon: Battery,
    intensity: 2
  },
  {
    id: 'unmotivated',
    emoji: '😔',
    label: 'Desmotivado',
    description: 'Sem muita vontade, mas quero tentar',
    icon: Frown,
    intensity: 1
  }
];

interface MoodSelectorProps {
  onMoodSelect: (mood: string, intensity: number) => void;
  workoutName: string;
}

export function MoodSelector({ onMoodSelect, workoutName }: MoodSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleMoodClick = (mood: MoodOption) => {
    setSelectedMood(mood.id);
    onMoodSelect(mood.id, mood.intensity);
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Como você está se sentindo hoje?</h3>
        <p className="text-sm text-muted-foreground">
          Vou adaptar seu treino "{workoutName}" ao seu estado atual
        </p>
      </div>

      <div className="grid gap-3">
        {moodOptions.map((mood) => {
          const Icon = mood.icon;
          const isSelected = selectedMood === mood.id;
          
          return (
            <Card 
              key={mood.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => handleMoodClick(mood)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{mood.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <h4 className="font-semibold">{mood.label}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mood.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
