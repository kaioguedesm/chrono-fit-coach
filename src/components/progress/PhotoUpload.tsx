import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, X, Loader2, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PhotoUploadProps {
  onSuccess: () => void;
}

export function PhotoUpload({ onSuccess }: PhotoUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [photoType, setPhotoType] = useState<'front' | 'side' | 'back'>('front');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 10MB",
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Formato inválido",
        description: "Selecione uma imagem (JPG, PNG, WEBP, HEIC)",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const uploadPhoto = async () => {
    if (!user || !selectedFile) {
      toast({
        title: "Erro",
        description: "Selecione uma foto para fazer upload.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          photo_url: fileName,
          photo_type: photoType,
          description: description || null,
          taken_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      toast({
        title: "Foto salva! 📸",
        description: "Sua foto de progresso foi registrada com sucesso."
      });

      clearSelection();
      setDescription('');
      onSuccess();
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro ao salvar foto",
        description: error.message || "Não foi possível fazer upload. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          Adicionar Foto de Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Foto</Label>
            <Select value={photoType} onValueChange={(v: any) => setPhotoType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="front">Frontal</SelectItem>
                <SelectItem value="side">Lateral</SelectItem>
                <SelectItem value="back">Costas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Input
              placeholder="Ex: 3 meses de treino"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
            />
          </div>
        </div>

        {previewUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-border">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-64 object-contain bg-muted"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={clearSelection}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="absolute bottom-2 left-2">
              <span className="bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                {(selectedFile!.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-4 bg-muted/30">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Registre sua evolução</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP ou HEIC (máx. 10MB)</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                type="button"
                className="gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Tirar Foto
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                type="button"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Galeria
              </Button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        <Button
          onClick={uploadPhoto}
          disabled={!selectedFile || uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Salvar Foto
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
