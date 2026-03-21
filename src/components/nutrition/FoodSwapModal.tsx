import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Repeat, Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface SwapResult {
  meal_id: string;
  new_name: string;
  reason: string;
}

interface FoodSwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutritionPlanId: string;
  planTitle: string;
  onSuccess: () => void;
}

const SUGGESTION_CHIPS = [
  "Não tenho acesso a salmão, troque por algo mais barato",
  "Quero trocar aveia por outro cereal acessível",
  "Substituir whey protein por alimento natural",
  "Trocar quinoa por algo mais barato e fácil de encontrar",
];

export function FoodSwapModal({
  open,
  onOpenChange,
  nutritionPlanId,
  planTitle,
  onSuccess,
}: FoodSwapModalProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SwapResult[] | null>(null);
  const [summary, setSummary] = useState("");

  const handleSwap = async () => {
    if (!message.trim()) {
      toast({
        title: "Descreva os alimentos",
        description: "Informe quais alimentos quer trocar e o motivo.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("swap-food", {
        body: { nutritionPlanId, userMessage: message.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResults(data.swaps || []);
      setSummary(data.summary || "");

      if ((data.swaps || []).length > 0) {
        toast({
          title: "Trocas realizadas! ✅",
          description: `${data.swaps.length} alimento(s) substituído(s) com sucesso.`,
        });
        onSuccess();
      } else {
        toast({
          title: "Nenhuma troca encontrada",
          description: "Os alimentos mencionados não foram encontrados na dieta.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível processar as trocas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setMessage("");
      setResults(null);
      setSummary("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" />
            Trocar Alimentos com IA
          </DialogTitle>
          <DialogDescription>
            Descreva os alimentos que você não tem acesso, não pode comprar ou quer substituir.
            A IA vai trocar por alternativas com valores nutricionais equivalentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Dieta: {planTitle}
            </p>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2">
            {SUGGESTION_CHIPS.map((chip) => (
              <Badge
                key={chip}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors text-xs py-1"
                onClick={() => setMessage(chip)}
              >
                {chip}
              </Badge>
            ))}
          </div>

          <Textarea
            placeholder="Ex: Não consigo comprar salmão e quinoa, troque por peixes e grãos mais baratos. Também quero substituir o whey por algo natural..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={loading}
          />

          <Button
            onClick={handleSwap}
            disabled={loading || !message.trim()}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analisando e trocando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Trocar Alimentos
              </>
            )}
          </Button>

          {/* Results */}
          {results && results.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                <CheckCircle2 className="w-4 h-4" />
                Trocas Realizadas
              </h4>
              {results.map((swap, i) => (
                <div
                  key={i}
                  className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary"
                >
                  <p className="font-medium text-sm">{swap.new_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {swap.reason}
                  </p>
                </div>
              ))}
              {summary && (
                <p className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg">
                  💡 {summary}
                </p>
              )}
            </div>
          )}

          {results && results.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-destructive/5 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive" />
              Nenhum dos alimentos mencionados foi encontrado na dieta atual.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
