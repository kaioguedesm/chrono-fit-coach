import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProgressPhoto {
  id: string;
  photo_url: string;
  photo_type: string;
  description: string | null;
  taken_at: string;
}

export function PhotoComparison() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [beforePhoto, setBeforePhoto] = useState<string>('');
  const [afterPhoto, setAfterPhoto] = useState<string>('');
  const [sliderPosition, setSliderPosition] = useState(50);

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user]);

  const fetchPhotos = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', user.id)
      .order('taken_at', { ascending: true });

    if (data) {
      setPhotos(data);
      if (data.length >= 2) {
        setBeforePhoto(data[0].id);
        setAfterPhoto(data[data.length - 1].id);
      }
    }
  };

  const beforePhotoData = photos.find(p => p.id === beforePhoto);
  const afterPhotoData = photos.find(p => p.id === afterPhoto);

  if (photos.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparação Antes/Depois</CardTitle>
          <CardDescription>
            Adicione pelo menos 2 fotos para comparar sua evolução
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação Antes/Depois</CardTitle>
        <CardDescription>
          Compare visualmente sua transformação ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Foto Antes</label>
            <Select value={beforePhoto} onValueChange={setBeforePhoto}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {photos.map(photo => (
                  <SelectItem key={photo.id} value={photo.id}>
                    {format(new Date(photo.taken_at), "dd/MM/yyyy", { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Foto Depois</label>
            <Select value={afterPhoto} onValueChange={setAfterPhoto}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {photos.map(photo => (
                  <SelectItem key={photo.id} value={photo.id}>
                    {format(new Date(photo.taken_at), "dd/MM/yyyy", { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {beforePhotoData && afterPhotoData && (
          <div className="space-y-4">
            {/* Comparison Slider */}
            <div className="relative h-96 rounded-lg overflow-hidden bg-muted">
              <img
                src={beforePhotoData.photo_url}
                alt="Antes"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={afterPhotoData.photo_url}
                  alt="Depois"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ width: `${100 * (100 / sliderPosition)}%` }}
                />
              </div>
              
              {/* Slider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-primary cursor-ew-resize"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={(e) => {
                  const handleMove = (moveEvent: MouseEvent) => {
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    if (rect) {
                      const x = moveEvent.clientX - rect.left;
                      const percentage = (x / rect.width) * 100;
                      setSliderPosition(Math.min(Math.max(percentage, 0), 100));
                    }
                  };
                  const handleUp = () => {
                    document.removeEventListener('mousemove', handleMove);
                    document.removeEventListener('mouseup', handleUp);
                  };
                  document.addEventListener('mousemove', handleMove);
                  document.addEventListener('mouseup', handleUp);
                }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <ArrowRight className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>

              {/* Labels */}
              <Badge className="absolute top-4 left-4">Antes</Badge>
              <Badge className="absolute top-4 right-4">Depois</Badge>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(beforePhotoData.taken_at), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  {beforePhotoData.description && (
                    <p className="mt-2 text-sm">{beforePhotoData.description}</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(afterPhotoData.taken_at), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  {afterPhotoData.description && (
                    <p className="mt-2 text-sm">{afterPhotoData.description}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
