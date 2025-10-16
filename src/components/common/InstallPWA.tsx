import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, X, Smartphone, Share } from "lucide-react";
import { toast } from "sonner";

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detecta iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Verifica se já está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Para Android/Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Mostra banner para iOS se não estiver instalado
    if (iOS && !standalone) {
      setTimeout(() => setShowBanner(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success('App instalado com sucesso!');
      setShowBanner(false);
    }
    
    setDeferredPrompt(null);
  };

  if (isStandalone || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md animate-in slide-in-from-bottom">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => setShowBanner(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Instalar ChronoFit</CardTitle>
              <CardDescription className="text-xs">
                Acesso rápido e funciona offline
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {isIOS ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Como instalar no iPhone/iPad:</p>
              <ol className="space-y-1 list-decimal list-inside text-xs">
                <li>Toque no botão <Share className="inline h-3 w-3 mx-1" /> (Compartilhar)</li>
                <li>Role e toque em "Adicionar à Tela de Início"</li>
                <li>Toque em "Adicionar"</li>
              </ol>
            </div>
          ) : (
            <Button 
              onClick={handleInstall} 
              className="w-full"
              disabled={!deferredPrompt}
            >
              <Download className="mr-2 h-4 w-4" />
              Instalar Aplicativo
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
