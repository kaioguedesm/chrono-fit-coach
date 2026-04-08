import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, Calendar, Columns2, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStorageUrl } from '@/hooks/useStorageUrl';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProgressPhoto {
  id: string;
  photo_url: string;
  photo_type: string;
  description: string | null;
  taken_at: string;
}

interface PhotoComparisonProps {
  refreshTrigger?: number;
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  front: 'Frontal',
  side: 'Lateral',
  back: 'Costas',
  frente: 'Frontal',
  lado: 'Lateral',
  costas: 'Costas',
};

function ComparisonImage({ photoUrl, label }: { photoUrl: string | null; label: string }) {
  const { url, loading } = useStorageUrl('progress-photos', photoUrl || null, 3600);
  if (loading || !url) return (
    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm animate-pulse">
      Carregando...
    </div>
  );
  return <img src={url} alt={label} className="w-full h-full object-cover" />;
}

export function PhotoComparison({ refreshTrigger }: PhotoComparisonProps) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [beforePhoto, setBeforePhoto] = useState<string>('');
  const [afterPhoto, setAfterPhoto] = useState<string>('');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState<'slider' | 'sideBySide'>('slider');
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchPhotos();
  }, [user, refreshTrigger]);

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

  const daysBetween = beforePhotoData && afterPhotoData
    ? differenceInDays(new Date(afterPhotoData.taken_at), new Date(beforePhotoData.taken_at))
    : 0;

  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 5), 95));
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => handleSliderMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleSliderMove(e.touches[0].clientX);
    const handleUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, handleSliderMove]);

  const formatPhotoLabel = (photo: ProgressPhoto) => {
    const date = format(new Date(photo.taken_at), "dd/MM/yyyy", { locale: ptBR });
    const type = PHOTO_TYPE_LABELS[photo.photo_type] || photo.photo_type;
    return `${date} · ${type}`;
  };

  if (photos.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            Comparação Antes/Depois
          </CardTitle>
          <CardDescription>
            {photos.length === 0
              ? 'Adicione fotos de progresso para comparar sua evolução'
              : 'Adicione pelo menos mais 1 foto para comparar sua evolução'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
              Antes & Depois
            </CardTitle>
            <CardDescription>
              {daysBetween > 0 && (
                <span className="flex items-center gap-1 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {daysBetween} dias de evolução
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            <Button
              variant={viewMode === 'slider' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setViewMode('slider')}
            >
              <Layers className="w-3.5 h-3.5 mr-1" />
              Slider
            </Button>
            <Button
              variant={viewMode === 'sideBySide' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setViewMode('sideBySide')}
            >
              <Columns2 className="w-3.5 h-3.5 mr-1" />
              Lado a Lado
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-0">
        {/* Photo Selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">📸 Antes</label>
            <Select value={beforePhoto} onValueChange={setBeforePhoto}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {photos.map(photo => (
                  <SelectItem key={photo.id} value={photo.id}>
                    {formatPhotoLabel(photo)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">🔥 Depois</label>
            <Select value={afterPhoto} onValueChange={setAfterPhoto}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {photos.map(photo => (
                  <SelectItem key={photo.id} value={photo.id}>
                    {formatPhotoLabel(photo)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {beforePhotoData && afterPhotoData && (
          <>
            {viewMode === 'slider' ? (
              <div
                ref={sliderRef}
                className="relative h-80 md:h-96 rounded-xl overflow-hidden bg-muted cursor-ew-resize select-none touch-none shadow-inner"
                onMouseDown={handleMouseDown}
                onTouchStart={(e) => {
                  setIsDragging(true);
                  handleSliderMove(e.touches[0].clientX);
                }}
              >
                <div className="absolute inset-0">
                  <ComparisonImage photoUrl={beforePhotoData.photo_url} label="Antes" />
                </div>
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                >
                  <ComparisonImage photoUrl={afterPhotoData.photo_url} label="Depois" />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/90 z-10 pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-primary">
                    <ArrowLeftRight className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="absolute top-3 left-3 z-20">
                  <Badge className="bg-black/70 text-white border-0 backdrop-blur-sm text-xs font-bold px-3 py-1">
                    ANTES
                  </Badge>
                </div>
                <div className="absolute top-3 right-3 z-20">
                  <Badge className="bg-primary text-primary-foreground border-0 backdrop-blur-sm text-xs font-bold px-3 py-1">
                    DEPOIS
                  </Badge>
                </div>
                {!isDragging && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5 animate-pulse">
                      <ChevronLeft className="w-3 h-3" />
                      Arraste para comparar
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                <div className="relative h-80 md:h-96 bg-muted">
                  <ComparisonImage photoUrl={beforePhotoData.photo_url} label="Antes" />
                  <div className="absolute top-3 left-3 z-10">
                    <Badge className="bg-black/70 text-white border-0 backdrop-blur-sm text-xs font-bold px-3 py-1">
                      ANTES
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 z-10">
                    <span className="text-white text-xs bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                      {format(new Date(beforePhotoData.taken_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <div className="relative h-80 md:h-96 bg-muted">
                  <ComparisonImage photoUrl={afterPhotoData.photo_url} label="Depois" />
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-primary text-primary-foreground border-0 backdrop-blur-sm text-xs font-bold px-3 py-1">
                      DEPOIS
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 z-10">
                    <span className="text-white text-xs bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                      {format(new Date(afterPhotoData.taken_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-muted/50 rounded-xl p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Início</p>
                  <p className="font-semibold">{format(new Date(beforePhotoData.taken_at), "dd MMM yyyy", { locale: ptBR })}</p>
                </div>
                <div className="flex-1 mx-3 relative">
                  <div className="h-1 bg-muted rounded-full">
                    <div className="h-full bg-gradient-to-r from-muted-foreground/40 to-primary rounded-full w-full" />
                  </div>
                  {daysBetween > 0 && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                      <Badge variant="outline" className="text-xs bg-background">
                        {daysBetween} dias
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Atual</p>
                  <p className="font-semibold">{format(new Date(afterPhotoData.taken_at), "dd MMM yyyy", { locale: ptBR })}</p>
                </div>
              </div>
            </div>

            {(beforePhotoData.description || afterPhotoData.description) && (
              <div className="grid grid-cols-2 gap-3">
                {beforePhotoData.description && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Nota - Antes</p>
                    <p className="text-sm">{beforePhotoData.description}</p>
                  </div>
                )}
                {afterPhotoData.description && (
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                    <p className="text-xs text-primary mb-1">Nota - Depois</p>
                    <p className="text-sm">{afterPhotoData.description}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
