import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useStorageUrl } from '@/hooks/useStorageUrl';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PhotoGalleryImage } from './PhotoGalleryImage';

interface ProgressPhoto {
  id: string;
  photo_url: string;
  photo_type: string;
  description: string | null;
  taken_at: string;
}

function SelectedPhotoView({ photo }: { photo: ProgressPhoto }) {
  const { url } = useStorageUrl('progress-photos', photo.photo_url, 3600);
  
  return (
    <div className="space-y-4">
      {url && (
        <img
          src={url}
          alt={photo.description || 'Foto de progresso'}
          className="w-full rounded-lg"
        />
      )}
      <div>
        <Badge>{photo.photo_type === 'frente' ? 'Frontal' : photo.photo_type === 'lado' ? 'Lateral' : 'Costas'}</Badge>
        <p className="text-sm text-muted-foreground mt-2">
          {format(new Date(photo.taken_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
        {photo.description && (
          <p className="mt-2">{photo.description}</p>
        )}
      </div>
    </div>
  );
}

export function PhotoGallery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user]);

  const fetchPhotos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false });

      if (error) throw error;

      setPhotos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as fotos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPhotoTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      frente: 'Frontal',
      lado: 'Lateral',
      costas: 'Costas'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Carregando fotos...</p>
        </CardContent>
      </Card>
    );
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhuma foto registrada ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Galeria de Progresso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative cursor-pointer group"
                onClick={() => setSelectedPhoto(photo)}
              >
                <PhotoGalleryImage
                  photoPath={photo.photo_url}
                  alt={photo.description || 'Foto de progresso'}
                  className="w-full h-48 object-cover rounded-lg transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center p-2">
                  <Badge variant="secondary" className="mb-2">
                    {getPhotoTypeLabel(photo.photo_type)}
                  </Badge>
                  <p className="text-xs text-white text-center">
                    {format(new Date(photo.taken_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Visualizar Foto de Progresso</DialogTitle>
            <DialogDescription className="sr-only">
              Visualização detalhada da foto de progresso
            </DialogDescription>
          </DialogHeader>
          {selectedPhoto && <SelectedPhotoView photo={selectedPhoto} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
