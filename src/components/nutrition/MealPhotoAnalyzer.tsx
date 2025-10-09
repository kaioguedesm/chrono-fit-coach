import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionData {
  mealName: string;
  foodItems: FoodItem[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  analysis: string;
  confidence: 'alta' | 'média' | 'baixa';
}

export function MealPhotoAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setNutritionData(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const clearPhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setNutritionData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const analyzePhoto = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });

      const imageBase64 = await base64Promise;

      console.log('Enviando foto para análise...');

      // Call edge function to analyze
      const { data, error } = await supabase.functions.invoke('analyze-meal-photo', {
        body: { imageBase64 }
      });

      if (error) {
        console.error('Erro ao analisar:', error);
        toast.error('Erro ao analisar a foto. Tente novamente.');
        return;
      }

      if (!data || !data.totals) {
        toast.error('Não foi possível analisar a refeição. Tente outra foto.');
        return;
      }

      console.log('Análise concluída:', data);
      setNutritionData(data);

      // Save to database
      await saveMealLog(data, imageBase64);

      toast.success('Refeição analisada com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar a foto');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveMealLog = async (data: NutritionData, imageBase64: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload photo to storage
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const base64Data = imageBase64.split(',')[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(r => r.blob());

      const { error: uploadError } = await supabase.storage
        .from('meal-photos')
        .upload(fileName, blob);

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError);
        return;
      }

      // Insert meal log
      const { error: insertError } = await supabase
        .from('meal_logs')
        .insert([{
          user_id: user.id,
          photo_url: fileName,
          meal_name: data.mealName,
          total_calories: data.totals.calories,
          total_protein: data.totals.protein,
          total_carbs: data.totals.carbs,
          total_fat: data.totals.fat,
          food_items: data.foodItems as any,
          ai_analysis: data.analysis
        }]);

      if (insertError) {
        console.error('Erro ao salvar:', insertError);
      }
    } catch (error) {
      console.error('Erro ao salvar log:', error);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'alta': return 'bg-green-500';
      case 'média': return 'bg-yellow-500';
      case 'baixa': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Análise de Refeição por Foto</h3>
        <p className="text-muted-foreground mb-6">
          Tire ou faça upload de uma foto da sua refeição e a IA calculará as calorias e macronutrientes automaticamente
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />

        {!previewUrl ? (
          <div className="space-y-4">
            <Button onClick={handleCameraClick} className="w-full" size="lg">
              <Camera className="mr-2 h-5 w-5" />
              Tirar Foto
            </Button>
            <Button onClick={handleUploadClick} variant="outline" className="w-full" size="lg">
              <Upload className="mr-2 h-5 w-5" />
              Fazer Upload
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border">
              <img src={previewUrl} alt="Preview" className="w-full h-auto" />
              <Button
                onClick={clearPhoto}
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {!nutritionData && (
              <Button 
                onClick={analyzePhoto} 
                disabled={isAnalyzing}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Analisar Refeição
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </Card>

      {isAnalyzing && (
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Processando imagem...</span>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
            <Progress value={33} />
          </div>
        </Card>
      )}

      {nutritionData && (
        <Card className="p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">{nutritionData.mealName}</h4>
            <Badge className={getConfidenceColor(nutritionData.confidence)}>
              Confiança {nutritionData.confidence}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Calorias</p>
              <p className="text-3xl font-bold text-primary">{nutritionData.totals.calories}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
            <div className="bg-accent/5 rounded-lg p-4 border border-accent/20">
              <p className="text-sm text-muted-foreground mb-1">Proteína</p>
              <p className="text-3xl font-bold text-accent">{nutritionData.totals.protein}g</p>
            </div>
            <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20">
              <p className="text-sm text-muted-foreground mb-1">Carboidratos</p>
              <p className="text-3xl font-bold text-secondary">{nutritionData.totals.carbs}g</p>
            </div>
            <div className="bg-orange-500/5 rounded-lg p-4 border border-orange-500/20">
              <p className="text-sm text-muted-foreground mb-1">Gorduras</p>
              <p className="text-3xl font-bold text-orange-600">{nutritionData.totals.fat}g</p>
            </div>
          </div>

          <div>
            <h5 className="font-semibold mb-3">Alimentos Identificados</h5>
            <div className="space-y-2">
              {nutritionData.foodItems.map((item, index) => (
                <div key={index} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.portion}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">{item.calories} kcal</p>
                    <p className="text-muted-foreground">
                      P: {item.protein}g | C: {item.carbs}g | G: {item.fat}g
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border">
            <h5 className="font-semibold mb-2">Análise Detalhada</h5>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{nutritionData.analysis}</p>
          </div>

          <Button onClick={clearPhoto} variant="outline" className="w-full">
            Analisar Nova Refeição
          </Button>
        </Card>
      )}
    </div>
  );
}
