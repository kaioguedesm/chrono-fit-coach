import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield } from "lucide-react";
import { authSchema } from "@/lib/validations";
import nexfitIcon from "@/assets/nexfit-icon.png";
import { TermsAcceptanceDialog, CURRENT_TERMS_VERSION } from "@/components/auth/TermsAcceptanceDialog";
import { supabase } from "@/integrations/supabase/client";

interface Gym {
  id: string;
  name: string;
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gymId, setGymId] = useState("");
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState<{ email: string; password: string; name: string } | null>(
    null,
  );

  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Buscar academias do banco
  useEffect(() => {
    const fetchGyms = async () => {
      setLoadingGyms(true);
      console.log("🔍 Iniciando busca de academias...");

      try {
        // Tentar primeiro via RPC (contorna cache do PostgREST)
        console.log("📡 Tentando buscar via RPC get_gyms...");
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)("get_gyms");

        console.log("📡 Resposta RPC:", { rpcData, rpcError });

        if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
          console.log("✅ Academias carregadas via RPC:", rpcData);
          console.log("📊 Total de academias:", rpcData.length);
          setGyms(rpcData.map((g: any) => ({ id: g.id, name: g.name })));
          setLoadingGyms(false);
          return;
        }

        if (rpcError) {
          console.log("⚠️ Erro RPC:", rpcError);
        } else {
          console.log("⚠️ RPC retornou vazio ou dados inválidos");
        }

        // Se RPC falhar, tentar via query normal
        console.log("📡 Tentando buscar via query normal...");
        const { data, error } = await supabase.from("gyms").select("id, name").order("name", { ascending: true });

        console.log("📡 Resposta query:", { data, error });

        if (!error && data && Array.isArray(data) && data.length > 0) {
          console.log("✅ Academias carregadas via query:", data);
          console.log("📊 Total de academias:", data.length);
          setGyms(data);
          setLoadingGyms(false);
          return;
        }

        // Se ambos falharem, mostrar erro mas não usar fallback automático
        console.error("❌ Não foi possível carregar academias do banco");
        console.error("Erro RPC:", rpcError);
        console.error("Erro Query:", error);
        setGyms([]);
        toast({
          title: "Erro ao carregar academias",
          description: "Não foi possível carregar a lista de academias. Verifique se a tabela foi criada corretamente.",
          variant: "destructive",
        });
      } catch (error: any) {
        console.error("❌ Erro ao buscar academias (catch):", error);
        setGyms([]);
        toast({
          title: "Erro",
          description: "Erro inesperado ao carregar academias.",
          variant: "destructive",
        });
      } finally {
        setLoadingGyms(false);
        console.log("🏁 Busca de academias finalizada");
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
          variant: "destructive",
        });
        setPendingSignupData(null);
        return;
      }

      // Aguardar um momento para garantir que a sessão esteja estabelecida e o perfil seja criado pelo trigger
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Obter o usuário criado
      const {
        data: { user: newUser },
      } = await supabase.auth.getUser();

      if (newUser) {
        // Garantir que o perfil seja criado/atualizado com o nome fornecido
        if (pendingSignupData.name.trim()) {
          const { error: profileError } = await supabase.from("profiles").upsert(
            {
              user_id: newUser.id,
              name: pendingSignupData.name.trim(),
              experience_level: "iniciante",
            },
            {
              onConflict: "user_id",
            },
          );

          if (profileError) {
            console.error("Erro ao atualizar perfil:", profileError);
            // Tentar apenas update se o upsert falhar
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ name: pendingSignupData.name.trim() })
              .eq("user_id", newUser.id);

            if (updateError) {
              console.error("Erro ao atualizar perfil (tentativa 2):", updateError);
            }
          }
        }

        // Criar role 'user' automaticamente para usuários comuns
        const { error: roleError } = await supabase.from("user_roles").upsert(
          {
            user_id: newUser.id,
            role: "user",
            approved: true,
          },
          {
            onConflict: "user_id,role",
          },
        );

        if (roleError) {
          console.error("Erro ao criar role 'user':", roleError);
          // Tentar inserção direta como fallback
          await supabase.from("user_roles").insert({
            user_id: newUser.id,
            role: "user",
            approved: true,
          });
        }

        // Salvar aceitação dos termos
        const { error: termsError } = await supabase.from("user_terms_acceptance").insert({
          user_id: newUser.id,
          terms_version: CURRENT_TERMS_VERSION,
          ip_address: null,
          user_agent: navigator.userAgent,
        });

        if (termsError) {
          console.error("Erro ao salvar aceitação dos termos:", termsError);
          // Não bloquear o cadastro, mas logar o erro
        }
      }

      toast({
        title: "Conta criada!",
        description: "Bem-vindo ao Nex Fit! 🎉",
      });
      navigate("/app");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
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
      variant: "default",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    try {
      const validationData = isLogin ? { email, password } : { email, password, name };

      authSchema.parse(validationData);
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || "Dados inválidos";
      toast({
        title: "Erro de validação",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    // Se for signup, mostrar termos primeiro
    if (!isLogin) {
      setPendingSignupData({ email, password, name });
      setShowTerms(true);
      return;
    }

    // Validar gym_id no login
    if (!gymId.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o ID da academia.",
        variant: "destructive",
      });
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
          variant: "destructive",
        });
      } else {
        // Aguardar um momento para garantir que a sessão esteja estabelecida
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Obter o usuário logado
        const {
          data: { user: loggedUser },
        } = await supabase.auth.getUser();

        if (loggedUser) {
          // Atualizar o perfil com o gym_id
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ gym_id: gymId.trim() })
            .eq("user_id", loggedUser.id);

          if (profileError) {
            console.error("Erro ao atualizar gym_id:", profileError);
            // Tentar upsert caso o perfil não exista
            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("name")
              .eq("user_id", loggedUser.id)
              .maybeSingle();

            await supabase.from("profiles").upsert(
              {
                user_id: loggedUser.id,
                name: existingProfile?.name || loggedUser.email?.split("@")[0] || "Usuário",
                gym_id: gymId.trim(),
                experience_level: "iniciante",
              },
              {
                onConflict: "user_id",
              },
            );
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
            <CardDescription className="text-base">
              {isLogin ? "Entre na sua conta" : "Crie sua conta e comece sua jornada"}
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

            {isLogin && (
              <div className="space-y-2">
                <Label htmlFor="gymId">Academia</Label>
                {loadingGyms ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Carregando academias...</span>
                  </div>
                ) : gyms.length > 0 ? (
                  <Select
                    value={gymId}
                    onValueChange={(value) => {
                      console.log("📝 Academia selecionada:", value);
                      setGymId(value);
                    }}
                    disabled={loading || loadingGyms}
                    required
                  >
                    <SelectTrigger id="gymId" className="w-full">
                      <SelectValue placeholder="Selecione sua academia" />
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
                      id="gymId"
                      type="text"
                      placeholder="Digite o ID da academia"
                      value={gymId}
                      onChange={(e) => setGymId(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Nenhuma academia cadastrada. Entre em contato com o administrador.
                    </p>
                  </>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Entrar" : "Criar conta"}
            </Button>

            <div className="text-center space-y-2">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
                className="w-full"
              >
                {isLogin ? "Não tem conta? Criar conta" : "Já tem conta? Fazer login"}
              </Button>

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

      <TermsAcceptanceDialog open={showTerms} onAccept={handleTermsAccept} onDecline={handleTermsDecline} />
    </div>
  );
}
