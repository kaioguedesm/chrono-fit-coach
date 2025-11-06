import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { authSchema } from '@/lib/validations';
import nexfitIcon from "@/assets/nexfit-icon.png";
import { TermsAcceptanceDialog, CURRENT_TERMS_VERSION } from '@/components/auth/TermsAcceptanceDialog';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState<{email: string, password: string, name: string} | null>(null);
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redireciona usuários autenticados para o app
  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  const handleTermsAccept = async () => {
    if (!pendingSignupData) return;

    setShowTerms(false);
    setLoading(true);

    try {
      const result = await signUp(pendingSignupData.email, pendingSignupData.password, pendingSignupData.name);

      if (result.error) {
        toast({
          title: "Erro",
          description: result.error.message,
          variant: "destructive"
        });
        setPendingSignupData(null);
        return;
      }

      // Salvar aceitação dos termos
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        await supabase.from('user_terms_acceptance').insert({
          user_id: newUser.id,
          terms_version: CURRENT_TERMS_VERSION,
          ip_address: null,
          user_agent: navigator.userAgent
        });
      }

      toast({
        title: "Conta criada!",
        description: "Bem-vindo ao Nex Fit! 🎉"
      });
      navigate('/app');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setPendingSignupData(null);
    }
  };

  const handleTermsDecline = () => {
    setShowTerms(false);
    setPendingSignupData(null);
    toast({
      title: "Cadastro cancelado",
      description: "Você precisa aceitar os termos para continuar.",
      variant: "default"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      const validationData = isLogin 
        ? { email, password } 
        : { email, password, name };
      
      authSchema.parse(validationData);
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || 'Dados inválidos';
      toast({
        title: "Erro de validação",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    // Se for signup, mostrar termos primeiro
    if (!isLogin) {
      setPendingSignupData({ email, password, name });
      setShowTerms(true);
      return;
    }

    // Login direto
    setLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.error) {
        toast({
          title: "Erro",
          description: result.error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta! 🎉"
        });
        navigate('/app');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
              <img 
                src={nexfitIcon} 
                alt="Nex Fit" 
                className="relative w-20 h-20 object-contain drop-shadow-2xl" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Nex Fit
            </CardTitle>
            <CardDescription className="text-base">
              {isLogin ? 'Entre na sua conta' : 'Crie sua conta e comece sua jornada'}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? 'Entrar' : 'Criar conta'}
            </Button>
            
            <div className="text-center space-y-2">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
                className="w-full"
              >
                {isLogin
                  ? 'Não tem conta? Criar conta'
                  : 'Já tem conta? Fazer login'
                }
              </Button>
              
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => navigate('/home')}
                className="text-muted-foreground hover:text-primary transition-colors group w-full"
              >
                <span className="flex items-center justify-center gap-2 text-sm">
                  ✨ Conheça mais sobre o Nex Fit
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/personal-login')}
                className="w-full border-primary/50 hover:bg-primary/10 transition-colors"
              >
                🏋️ Área do Personal Trainer
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>

      <TermsAcceptanceDialog
        open={showTerms}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
      />
    </div>
  );
}