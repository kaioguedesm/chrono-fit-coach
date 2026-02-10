import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { authSchema } from "@/lib/validations";
import nexfitIcon from "@/assets/nexfit-icon.png";
import { supabase } from "@/integrations/supabase/client";

interface Gym {
  id: string;
  name: string;
}

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gymId, setGymId] = useState("");
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGyms, setLoadingGyms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Buscar academias do banco (igual ao PersonalAuth.tsx)
  useEffect(() => {
    const fetchGyms = async () => {
      setLoadingGyms(true);
      console.log("🔍 [Auth] Iniciando busca de academias...");

      try {
        // Tentar primeiro via RPC
        console.log("📡 [Auth] Tentando buscar via RPC get_gyms...");
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)("get_gyms");

        console.log("📡 [Auth] Resposta RPC:", { rpcData, rpcError });

        if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
          console.log("✅ [Auth] Academias carregadas via RPC:", rpcData);
          setGyms(rpcData.map((g: any) => ({ id: g.id, name: g.name })));
          setLoadingGyms(false);
          return;
        }

        // Tentar via query normal
        console.log("📡 [Auth] Tentando buscar via query normal...");
        const { data, error } = await supabase.from("gyms").select("id, name").order("name", { ascending: true });

        console.log("📡 [Auth] Resposta query:", { data, error });

        if (!error && data && Array.isArray(data) && data.length > 0) {
          console.log("✅ [Auth] Academias carregadas:", data);
          setGyms(data);
          setLoadingGyms(false);
          return;
        }

        // Se ambos falharem
        console.error("❌ [Auth] Não foi possível carregar academias");
        setGyms([]);
        toast({
          title: "Erro ao carregar academias",
          description: "Verifique se a tabela foi criada corretamente.",
          variant: "destructive",
        });
      } catch (error: any) {
        console.error("❌ [Auth] Erro:", error);
        setGyms([]);
        toast({
          title: "Erro ao carregar academias",
          description: error.message || "Não foi possível carregar as academias.",
          variant: "destructive",
        });
      } finally {
        setLoadingGyms(false);
      }
    };

    fetchGyms();
  }, [toast]);

  // Redireciona usuários autenticados para o app
  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar inputs
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

    // Validar gym_id no login (igual ao PersonalAuth.tsx)
    if (!gymId.trim()) {
      toast({
        title: "Academia obrigatória",
        description: "Por favor, selecione a academia.",
        variant: "destructive",
      });
      return;
    }

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
        // Aguardar um momento para garantir que a sessão esteja estabelecida
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Atualizar perfil com a academia selecionada (igual ao PersonalAuth.tsx, mas em profiles)
        if (gymId.trim()) {
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser();

          if (currentUser) {
            const { error: profileError } = await supabase
              .from("profiles")
              .update({ gym_id: gymId.trim() } as any)
              .eq("user_id", currentUser.id);

            if (profileError) {
              console.error("Erro ao atualizar gym_id:", profileError);
              // Tentar upsert caso o registro não exista (igual ao PersonalAuth.tsx)
              await supabase.from("profiles").upsert(
                {
                  user_id: currentUser.id,
                  gym_id: gymId.trim(),
                } as any,
                {
                  onConflict: "user_id",
                },
              );
            }
          }
        }

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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gym">Academia</Label>
              {loadingGyms ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando academias...</span>
                </div>
              ) : gyms.length > 0 ? (
                <Select
                  value={gymId}
                  onValueChange={(value) => {
                    console.log("📝 [Auth] Academia selecionada:", value);
                    setGymId(value);
                  }}
                  disabled={loading || loadingGyms}
                  required
                >
                  <SelectTrigger id="gym" className="w-full">
                    <SelectValue placeholder="Selecione a academia" />
                  </SelectTrigger>
                  <SelectContent>
                    {gyms.map((gym) => (
                      <SelectItem key={gym.id} value={gym.id}>
                        {gym.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <>
                  <Input
                    id="gym"
                    type="text"
                    placeholder="Digite o ID da academia"
                    value={gymId}
                    onChange={(e) => setGymId(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Nenhuma academia cadastrada. Entre em contato com o administrador.
                  </p>
                </>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading || loadingGyms}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>

            <div className="text-center space-y-2">
              {/* <Button
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
              </Button> */}

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
