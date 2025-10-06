import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Scale, Ruler, Activity } from 'lucide-react';

interface MeasurementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeasurementModal({ open, onOpenChange }: MeasurementModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [measurement, setMeasurement] = useState({
    weight: '',
    bodyFat: '',
    muscleMass: '',
    chest: '',
    waist: '',
    hips: '',
    arm: '',
    thigh: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('body_measurements')
        .insert({
          user_id: user.id,
          weight: measurement.weight ? parseFloat(measurement.weight) : null,
          body_fat_percentage: measurement.bodyFat ? parseFloat(measurement.bodyFat) : null,
          muscle_mass: measurement.muscleMass ? parseFloat(measurement.muscleMass) : null,
          chest: measurement.chest ? parseFloat(measurement.chest) : null,
          waist: measurement.waist ? parseFloat(measurement.waist) : null,
          hips: measurement.hips ? parseFloat(measurement.hips) : null,
          arm: measurement.arm ? parseFloat(measurement.arm) : null,
          thigh: measurement.thigh ? parseFloat(measurement.thigh) : null,
          measured_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Medidas registradas!",
        description: "Suas medidas foram salvas com sucesso."
      });

      setMeasurement({
        weight: '',
        bodyFat: '',
        muscleMass: '',
        chest: '',
        waist: '',
        hips: '',
        arm: '',
        thigh: ''
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as medidas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Registrar Medidas
          </DialogTitle>
          <DialogDescription>
            Registre suas medidas corporais para acompanhar sua evolução
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Peso (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="Ex: 75.5"
                value={measurement.weight}
                onChange={(e) => setMeasurement({ ...measurement, weight: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyFat" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Gordura Corporal (%)
              </Label>
              <Input
                id="bodyFat"
                type="number"
                step="0.1"
                placeholder="Ex: 15.5"
                value={measurement.bodyFat}
                onChange={(e) => setMeasurement({ ...measurement, bodyFat: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="muscleMass" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Massa Muscular (kg)
              </Label>
              <Input
                id="muscleMass"
                type="number"
                step="0.1"
                placeholder="Ex: 60.5"
                value={measurement.muscleMass}
                onChange={(e) => setMeasurement({ ...measurement, muscleMass: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chest" className="flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Peito (cm)
              </Label>
              <Input
                id="chest"
                type="number"
                step="0.1"
                placeholder="Ex: 95.0"
                value={measurement.chest}
                onChange={(e) => setMeasurement({ ...measurement, chest: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waist" className="flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Cintura (cm)
              </Label>
              <Input
                id="waist"
                type="number"
                step="0.1"
                placeholder="Ex: 80.0"
                value={measurement.waist}
                onChange={(e) => setMeasurement({ ...measurement, waist: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hips" className="flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Quadril (cm)
              </Label>
              <Input
                id="hips"
                type="number"
                step="0.1"
                placeholder="Ex: 90.0"
                value={measurement.hips}
                onChange={(e) => setMeasurement({ ...measurement, hips: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="arm" className="flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Braço (cm)
              </Label>
              <Input
                id="arm"
                type="number"
                step="0.1"
                placeholder="Ex: 35.0"
                value={measurement.arm}
                onChange={(e) => setMeasurement({ ...measurement, arm: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thigh" className="flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Coxa (cm)
              </Label>
              <Input
                id="thigh"
                type="number"
                step="0.1"
                placeholder="Ex: 55.0"
                value={measurement.thigh}
                onChange={(e) => setMeasurement({ ...measurement, thigh: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Medidas"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
