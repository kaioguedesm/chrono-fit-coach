import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PhotoUpload } from '@/components/progress/PhotoUpload';

interface PhotoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhotoUploadModal({ open, onOpenChange }: PhotoUploadModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Foto de Progresso</DialogTitle>
          <DialogDescription>
            Tire ou faça upload de uma foto para acompanhar sua evolução
          </DialogDescription>
        </DialogHeader>
        <PhotoUpload onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
