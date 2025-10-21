import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

interface DietAnalysis {
  summary: string;
  dailyCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  mealsIdentified: number;
  adherenceScore: number;
  personalizedInsight: string;
}

export function DietUploader() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DietAnalysis | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['text/plain', 'application/pdf', 'application/msword', 
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'image/png', 'image/jpeg', 'image/jpg'];
    
    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie um arquivo PDF, DOC, DOCX, TXT ou imagem.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    setAnalysis(null);
  };

  const readFileAsText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      
      reader.onerror = () => reject(new Error('Error reading file'));
      
      // For images, convert to base64 for AI vision
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo primeiro.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const fileContent = await readFileAsText(file);

      const { data, error } = await supabase.functions.invoke('analyze-diet-file', {
        body: {
          fileContent: fileContent.substring(0, 50000), // Limit content size
          fileName: file.name,
          additionalNotes: additionalNotes.trim() || undefined
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
      
      toast({
        title: "Análise concluída!",
        description: "Sua dieta foi analisada com sucesso pela IA.",
      });

    } catch (error: any) {
      console.error('Error analyzing diet:', error);
      toast({
        title: "Erro na análise",
        description: error.message || "Não foi possível analisar o arquivo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excelente';
    if (score >= 6) return 'Bom';
    if (score >= 4) return 'Regular';
    return 'Precisa melhorar';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload de Dieta
          </CardTitle>
          <CardDescription>
            Envie sua dieta e deixe a IA analisar e dar sugestões personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="diet-file">Arquivo da Dieta</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                id="diet-file"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
              />
              <label htmlFor="diet-file" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Clique para fazer upload
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX, TXT ou imagem até 10MB
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionais (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione informações extras sobre sua dieta, preferências, restrições ou objetivos específicos que você gostaria que a IA considerasse..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={4}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {additionalNotes.length}/1000
            </p>
          </div>

          <Button 
            className="w-full" 
            onClick={handleAnalyze}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analisar com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          {/* Summary Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-primary" />
                Análise Completa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.summary}
              </p>

              {/* Adherence Score */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Aderência aos Objetivos</span>
                  <span className={`text-lg font-bold ${getScoreColor(analysis.adherenceScore)}`}>
                    {analysis.adherenceScore}/10 - {getScoreLabel(analysis.adherenceScore)}
                  </span>
                </div>
                <Progress value={analysis.adherenceScore * 10} className="h-2" />
              </div>

              {/* Personalized Insight */}
              <Alert className="bg-primary/5 border-primary/20">
                <Lightbulb className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  {analysis.personalizedInsight}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Macros Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações Nutricionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {analysis.dailyCalories}
                  </div>
                  <div className="text-xs text-muted-foreground">Calorias/dia</div>
                </div>
                <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysis.macros.protein}g
                  </div>
                  <div className="text-xs text-muted-foreground">Proteína</div>
                </div>
                <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {analysis.macros.carbs}g
                  </div>
                  <div className="text-xs text-muted-foreground">Carboidrato</div>
                </div>
                <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {analysis.macros.fat}g
                  </div>
                  <div className="text-xs text-muted-foreground">Gordura</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Badge variant="outline">
                  {analysis.mealsIdentified} refeições identificadas
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <Card className="border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  Pontos Fortes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Improvements */}
          {analysis.improvements.length > 0 && (
            <Card className="border-yellow-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-yellow-600">
                  <AlertTriangle className="w-5 h-5" />
                  Áreas de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.improvements.map((improvement, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Card className="border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                  Recomendações Personalizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.recommendations.map((recommendation, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
