import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  emoji: string;
}

const steps: OnboardingStep[] = [
  {
    emoji: "👋",
    title: "Bem-vindo ao Nex Fit!",
    description: "Vamos fazer um tour rápido pelas principais funcionalidades do app."
  },
  {
    emoji: "🏋️",
    title: "Dashboard",
    description: "Aqui você vê seu progresso, próximos treinos e ações rápidas para começar o dia."
  },
  {
    emoji: "💪",
    title: "Treinos",
    description: "Crie treinos personalizados ou gere treinos com IA. Edite, compartilhe e acompanhe seu progresso."
  },
  {
    emoji: "📊",
    title: "Progresso",
    description: "Acompanhe suas medidas, fotos de evolução e conquistas ao longo da jornada."
  },
  {
    emoji: "🍎",
    title: "Nutrição",
    description: "Gere planos alimentares com IA e registre suas refeições com análise por foto."
  },
  {
    emoji: "🚀",
    title: "Pronto para Começar!",
    description: "Agora você conhece todas as funcionalidades. Vamos começar sua jornada fitness!"
  }
];

export function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("nexfit-tour-completed");
    if (!hasSeenTour) {
      setTimeout(() => setIsVisible(true), 1000);
    }
    
    // Handler para fechar com ESC
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible]);

  const handleClose = () => {
    localStorage.setItem("nexfit-tour-completed", "true");
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      handleClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <Card className="w-full max-w-md animate-scale-in shadow-2xl relative z-[101] bg-card border-2 border-border">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-4xl">{step.emoji}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <h3 className="text-xl font-bold mb-2 text-foreground">{step.title}</h3>
          <p className="text-sm text-muted-foreground mb-6">{step.description}</p>

          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStep
                      ? "w-8 bg-primary"
                      : idx < currentStep
                      ? "w-1.5 bg-primary/50"
                      : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
              >
                {currentStep === steps.length - 1 ? "Começar" : "Próximo"}
                {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-4 w-full text-center"
          >
            Pular tour
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
