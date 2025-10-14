import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { photoUploadSchema } from '@/lib/validations';

interface PhotoUploadProps {
  onSuccess: () => void;
}

export function PhotoUpload({ onSuccess }: PhotoUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [photoType, setPhotoType] = useState<'frente' | 'lado' | 'costas'>('frente');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('Arquivo selecionado:', file.name, file.size, file.type);

    // Validate file
    try {
      photoUploadSchema.pick({ file: true }).parse({ file });
      console.log('Validação do arquivo passou');
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || 'Arquivo inválido';
      console.error('Erro na validação do arquivo:', error);
      toast({
        title: "Erro de validação",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    console.log('Preview URL criada:', objectUrl);
  };

  const uploadPhoto = async () => {
    if (!user || !selectedFile) {
      console.error('Upload cancelado - Usuário ou arquivo não disponível', { user: !!user, selectedFile: !!selectedFile });
      toast({
        title: "Erro",
        description: "Por favor, selecione uma foto para fazer upload.",
        variant: "destructive"
      });
      return;
    }

    console.log('Iniciando upload da foto...', { 
      userId: user.id, 
      fileName: selectedFile.name,
      photoType,
      description 
    });

    // Validate all fields
    try {
      photoUploadSchema.parse({
        file: selectedFile,
        photo_type: photoType,
        description: description || undefined,
      });
      console.log('Validação completa passou');
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || 'Dados inválidos';
      console.error('Erro na validação completa:', error);
      toast({
        title: "Erro de validação",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      console.log('Nome do arquivo no storage:', fileName);

      // Upload to storage
      console.log('Fazendo upload para o storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload para storage:', uploadError);
        throw uploadError;
      }
      console.log('Upload para storage concluído:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);
      console.log('URL pública gerada:', publicUrl);

      // Insert into database
      console.log('Inserindo registro no banco de dados...');
      const { data: dbData, error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          photo_url: publicUrl,
          photo_type: photoType,
          description: description || null,
          taken_at: new Date().toISOString()
        })
        .select();

      if (dbError) {
        console.error('Erro ao inserir no banco:', dbError);
        throw dbError;
      }
      console.log('Registro criado no banco:', dbData);

      toast({
        title: "Foto salva! 📸",
        description: "Sua foto de progresso foi registrada."
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription('');
      onSuccess();
    } catch (error: any) {
      console.error('Erro geral no upload:', error);
      toast({
        title: "Erro ao salvar foto",
        description: error.message || "Não foi possível fazer upload da foto. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Foto de Progresso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tipo de Foto</Label>
          <Select value={photoType} onValueChange={(v: any) => setPhotoType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frente">Frontal</SelectItem>
              <SelectItem value="lado">Lateral</SelectItem>
              <SelectItem value="costas">Costas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Descrição (opcional)</Label>
          <Input
            placeholder="Ex: 3 meses de treino"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
            <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium mb-1">Adicione uma foto de progresso</p>
              <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP (máx. 10MB)</p>
            </div>
            <Button
              variant="outline"
              onClick={() => document.getElementById('photo-upload')?.click()}
              type="button"
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Foto
            </Button>
            <Input
              id="photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        <Button
          onClick={uploadPhoto}
          disabled={!selectedFile || uploading}
          className="w-full"
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
