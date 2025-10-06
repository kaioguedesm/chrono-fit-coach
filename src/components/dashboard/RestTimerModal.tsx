import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface RestTimerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestTimerModal({ open, onOpenChange }: RestTimerModalProps) {
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const playSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZVRQMVI/l8dSANwcfcsLu4JdKEAtKp+PxtGMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZVRQMVI/l8dSANwcfcsLu4JdKEAtKp+PxtGMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZVRQMVI/l8dSANwcfcsLu4JdKEAtKp+PxtGMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZVRQMVI/l8dSANwcfcsLu4JdKEAtKp+PxtGMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZVRQMVI/l8dSANwcfcsLu4JdKEAtKp+PxtGMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZVRQMVI/l8dSANwcfcsLu4JdKEAtKp+PxtGMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZVRQMVI/l8dSANwcfcsLu4JdKEAtKp+PxtGMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZVRQMVIzl8NSANwcfcsLu4JdKEAtKp+PxtGMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZVRQMVI/l8dSANwcfcsLu4JdKEAtKp+PxtGMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZVRQMVI/l8dSANwcfcsLu4JdKEAtKp+PxtGMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZVRQMVI/l8dSANwcfcsLu4JdKEAtKp+PxtGMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZVRQ=');
    audio.play().catch(() => {});
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (isConfiguring) {
      setTimeLeft(duration);
      setIsConfiguring(false);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    setIsConfiguring(true);
  };

  const progressPercentage = ((duration - timeLeft) / duration) * 100;

  const presetTimes = [
    { label: '30s', value: 30 },
    { label: '1min', value: 60 },
    { label: '1min 30s', value: 90 },
    { label: '2min', value: 120 },
    { label: '3min', value: 180 }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            Timer de Descanso
          </DialogTitle>
          <DialogDescription>
            Configure o tempo de descanso entre as séries
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isConfiguring ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (segundos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="10"
                  max="600"
                  value={duration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 60;
                    setDuration(val);
                    setTimeLeft(val);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Tempos Rápidos</Label>
                <div className="grid grid-cols-3 gap-2">
                  {presetTimes.map((preset) => (
                    <Button
                      key={preset.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDuration(preset.value);
                        setTimeLeft(preset.value);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold tabular-nums">
                  {formatTime(timeLeft)}
                </div>
                <Progress value={progressPercentage} className="h-2" />
                {timeLeft === 0 && (
                  <p className="text-lg font-semibold text-primary animate-pulse">
                    Descanso concluído! 🎉
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2 justify-center">
            {isConfiguring ? (
              <Button onClick={handleStart} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </Button>
            ) : (
              <>
                {isRunning ? (
                  <Button onClick={handlePause} variant="outline" className="flex-1">
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </Button>
                ) : (
                  <Button onClick={handleStart} className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    {timeLeft === 0 ? 'Reiniciar' : 'Continuar'}
                  </Button>
                )}
                <Button onClick={handleReset} variant="outline" className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
