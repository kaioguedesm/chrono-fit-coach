import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, Trash2, Calendar, Loader2, ImageIcon } from 'lucide-react';
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

interface PhotoGalleryProps {
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

function SelectedPhotoView({ photo, onDelete }: { photo: ProgressPhoto; onDelete: () => void }) {
  const { url } = useStorageUrl('progress-photos', photo.photo_url, 3600);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="space-y-4">
      {url ? (
        <img
          src={url}
          alt={photo.description || 'Foto de progresso'}
          className="w-full max-h-[70vh] object-contain rounded-lg bg-muted"
        />
      ) : (
        <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge>{PHOTO_TYPE_LABELS[photo.photo_type] || photo.photo_type}</Badge>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(photo.taken_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={deleting}
          onClick={async () => {
            setDeleting(true);
            onDelete();
          }}
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
      </div>
      {photo.description && (
        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{photo.description}</p>
      )}
    </div>
  );
}

export function PhotoGallery({ refreshTrigger }: PhotoGalleryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (user) fetchPhotos();
  }, [user, refreshTrigger]);

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

  const deletePhoto = async (photo: ProgressPhoto) => {
    if (!user) return;
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('progress-photos')
        .remove([photo.photo_url]);
      
      if (storageError) console.error('Storage delete error:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photo.id)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      toast({ title: "Foto excluída! 🗑️", description: "A foto foi removida com sucesso." });
      setSelectedPhoto(null);
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a foto.",
        variant: "destructive"
      });
    }
  };

  const filteredPhotos = filterType === 'all' 
    ? photos 
    : photos.filter(p => p.photo_type === filterType);

  const photoCountByType = {
    all: photos.length,
    front: photos.filter(p => p.photo_type === 'front').length,
    side: photos.filter(p => p.photo_type === 'side').length,
    back: photos.filter(p => p.photo_type === 'back').length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Carregando fotos...</p>
        </CardContent>
      </Card>
    );
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">Nenhuma foto registrada</h3>
          <p className="text-sm text-muted-foreground">
            Adicione fotos de progresso para acompanhar sua evolução visual
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Galeria de Progresso
              <Badge variant="secondary" className="ml-1">{photos.length}</Badge>
            </CardTitle>
          </div>
          {/* Filter Chips */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'front', label: 'Frontal' },
              { key: 'side', label: 'Lateral' },
              { key: 'back', label: 'Costas' },
            ].map(f => (
              <Button
                key={f.key}
                variant={filterType === f.key ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilterType(f.key)}
                disabled={photoCountByType[f.key as keyof typeof photoCountByType] === 0 && f.key !== 'all'}
              >
                {f.label} ({photoCountByType[f.key as keyof typeof photoCountByType]})
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative cursor-pointer group rounded-xl overflow-hidden shadow-sm border border-border/50"
                onClick={() => setSelectedPhoto(photo)}
              >
                <PhotoGalleryImage
                  photoPath={photo.photo_url}
                  alt={photo.description || 'Foto de progresso'}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                  <Badge variant="secondary" className="w-fit mb-1 text-xs">
                    {PHOTO_TYPE_LABELS[photo.photo_type] || photo.photo_type}
                  </Badge>
                  <p className="text-xs text-white/90">
                    {format(new Date(photo.taken_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                {/* Always visible date on mobile */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 md:hidden">
                  <p className="text-[10px] text-white/90">
                    {format(new Date(photo.taken_at), "dd/MM/yy")}
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
            <DialogTitle>Foto de Progresso</DialogTitle>
            <DialogDescription>
              Visualize e gerencie sua foto de progresso
            </DialogDescription>
          </DialogHeader>
          {selectedPhoto && (
            <SelectedPhotoView 
              photo={selectedPhoto} 
              onDelete={() => deletePhoto(selectedPhoto)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
