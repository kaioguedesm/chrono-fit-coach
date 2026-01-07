import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield } from "lucide-react";
import { authSchema } from "@/lib/validations";
import nexfitIcon from "@/assets/nexfit-icon.png";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redireciona usuários autenticados para o app
  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    try {
      authSchema.parse({ email, password });
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || "Dados inválidos";
      toast({
        title: "Erro de validação",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    // Login
    setLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.error) {
        toast({
          title: "Erro",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta! 🎉",
        });
        navigate("/app");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
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
              <img src={nexfitIcon} alt="Nex Fit" className="relative w-20 h-20 object-contain drop-shadow-2xl" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Nex Fit
            </CardTitle>
            <CardDescription className="text-base">Entre na sua conta</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>

            <div className="text-center space-y-2">
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => navigate("/home")}
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
                size="lg"
                onClick={() => navigate("/personal-login")}
                className="w-full border-primary bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all shadow-md hover:shadow-lg font-semibold group"
              >
                <Shield className="mr-2 h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-base">Área do Personal Trainer</span>
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Para personal trainers que desejam gerenciar alunos
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
