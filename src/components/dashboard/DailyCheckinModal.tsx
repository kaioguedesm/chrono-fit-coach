import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Utensils, Droplets, Zap, Heart, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DailyCheckinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  existingCheckin?: any;
}

const dietOptions = [
  { value: 'yes', label: 'Sim', emoji: '✅' },
  { value: 'partial', label: 'Parcial', emoji: '⚠️' },
  { value: 'no', label: 'Não', emoji: '❌' },
];

export function DailyCheckinModal({ open, onOpenChange, onSubmit, existingCheckin }: DailyCheckinModalProps) {
  const [workoutDone, setWorkoutDone] = useState(existingCheckin?.workout_done || false);
  const [dietFollowed, setDietFollowed] = useState(existingCheckin?.diet_followed || 'no');
  const [waterMl, setWaterMl] = useState(existingCheckin?.water_ml || 0);
  const [energyLevel, setEnergyLevel] = useState(existingCheckin?.energy_level || 3);
  const [motivationLevel, setMotivationLevel] = useState(existingCheckin?.motivation_level || 3);
  const [painLevel, setPainLevel] = useState(existingCheckin?.pain_level || 0);
  const [notes, setNotes] = useState(existingCheckin?.notes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        workout_done: workoutDone,
        diet_followed: dietFollowed,
        water_ml: waterMl,
        energy_level: energyLevel,
        motivation_level: motivationLevel,
        pain_level: painLevel,
        notes: notes || null,
      });
      toast.success('Check-in registrado! +10 XP 🎉');
      onOpenChange(false);
    } catch {
      toast.error('Erro ao salvar check-in');
    } finally {
      setSubmitting(false);
    }
  };

  const waterOptions = [500, 1000, 1500, 2000, 2500, 3000, 3500];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ✅ Check-in Diário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Treino */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-5 h-5 text-primary" />
              <Label className="text-sm font-medium">Treinou hoje?</Label>
            </div>
            <Switch checked={workoutDone} onCheckedChange={setWorkoutDone} />
          </div>

          {/* Dieta */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Seguiu a dieta?</Label>
            </div>
            <div className="flex gap-2">
              {dietOptions.map(opt => (
                <Button
                  key={opt.value}
                  variant={dietFollowed === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setDietFollowed(opt.value)}
                >
                  {opt.emoji} {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Água */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                <Label className="text-sm font-medium">Água consumida</Label>
              </div>
              <Badge variant="outline">{(waterMl / 1000).toFixed(1)}L</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {waterOptions.map(ml => (
                <Button
                  key={ml}
                  variant={waterMl === ml ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWaterMl(ml)}
                >
                  {(ml / 1000).toFixed(1)}L
                </Button>
              ))}
            </div>
          </div>

          {/* Energia */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <Label className="text-sm font-medium">Nível de energia</Label>
              </div>
              <span className="text-sm font-semibold">{energyLevel}/5</span>
            </div>
            <Slider value={[energyLevel]} onValueChange={([v]) => setEnergyLevel(v)} min={1} max={5} step={1} />
          </div>

          {/* Motivação */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <Label className="text-sm font-medium">Motivação</Label>
              </div>
              <span className="text-sm font-semibold">{motivationLevel}/5</span>
            </div>
            <Slider value={[motivationLevel]} onValueChange={([v]) => setMotivationLevel(v)} min={1} max={5} step={1} />
          </div>

          {/* Dor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <Label className="text-sm font-medium">Nível de dor</Label>
              </div>
              <span className="text-sm font-semibold">{painLevel}/10</span>
            </div>
            <Slider value={[painLevel]} onValueChange={([v]) => setPainLevel(v)} min={0} max={10} step={1} />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Observações (opcional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Como foi seu dia?"
              rows={2}
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
            {submitting ? 'Salvando...' : existingCheckin ? 'Atualizar Check-in' : 'Fazer Check-in ✅'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
