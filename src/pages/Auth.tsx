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
import nexfitLogo from "@/assets/nexfit-logo.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redireciona usuários autenticados para o app
  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

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

    setLoading(true);

    try {
      let result;
      
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, name);
      }

      if (result.error) {
        toast({
          title: "Erro",
          description: result.error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: isLogin ? "Login realizado!" : "Conta criada!",
          description: isLogin ? "Bem-vindo de volta! 🎉" : "Conta criada com sucesso! 🎉"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center">
              <img src={nexfitLogo} alt="Nex Fit Logo" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Nex Fit
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </CardDescription>
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
            
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
              >
                {isLogin
                  ? 'Não tem conta? Criar conta'
                  : 'Já tem conta? Fazer login'
                }
              </Button>
            </div>

            <div className="text-center pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/landing')}
                disabled={loading}
                className="text-sm"
              >
                Saiba mais sobre o Nex Fit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}