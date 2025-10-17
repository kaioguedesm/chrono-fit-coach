import { useStorageUrl } from '@/hooks/useStorageUrl';
import { Loader2 } from 'lucide-react';

interface PhotoGalleryImageProps {
  photoPath: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function PhotoGalleryImage({ photoPath, alt, className, onClick }: PhotoGalleryImageProps) {
  const { url, loading, error } = useStorageUrl('progress-photos', photoPath, 3600);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <p className="text-xs text-muted-foreground">Erro ao carregar</p>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onClick={onClick}
    />
  );
}
