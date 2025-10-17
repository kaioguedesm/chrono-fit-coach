import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, X, Smartphone, Share, Chrome } from "lucide-react";
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

    // Mostra banner após 2 segundos se não estiver instalado
    if (!standalone) {
      setTimeout(() => setShowBanner(true), 2000);
    }

    // Para Android/Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.info("Use o menu do navegador para instalar o app");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success('App instalado com sucesso!');
      setShowBanner(false);
    }
    
    setDeferredPrompt(null);
  };

  if (isStandalone) return null;
  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md animate-in slide-in-from-bottom">
      <Card className="border-primary/20 shadow-xl bg-card/95 backdrop-blur">
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
              <CardTitle className="text-base">Instalar Meta Fit</CardTitle>
              <CardDescription className="text-xs">
                Acesso rápido direto da tela inicial
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {isIOS ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium flex items-center gap-2">
                <Share className="h-4 w-4 text-primary" />
                Como instalar no Safari:
              </p>
              <ol className="space-y-1.5 list-decimal list-inside text-xs text-muted-foreground ml-1">
                <li>Toque no botão de compartilhar (quadrado com seta ↑)</li>
                <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
                <li>Toque em "Adicionar" no canto superior direito</li>
              </ol>
            </div>
          ) : (
            <div className="space-y-2">
              {deferredPrompt ? (
                <Button 
                  onClick={handleInstall} 
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Instalar Agora
                </Button>
              ) : (
                <div className="space-y-2 text-sm">
                  <p className="font-medium flex items-center gap-2">
                    <Chrome className="h-4 w-4 text-primary" />
                    Como instalar no Chrome/Android:
                  </p>
                  <ol className="space-y-1.5 list-decimal list-inside text-xs text-muted-foreground ml-1">
                    <li>Toque no menu (⋮) no canto superior direito</li>
                    <li>Toque em "Instalar app" ou "Adicionar à tela inicial"</li>
                    <li>Confirme tocando em "Instalar"</li>
                  </ol>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-center text-muted-foreground pt-1">
            ✨ Funciona offline e carrega mais rápido!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
