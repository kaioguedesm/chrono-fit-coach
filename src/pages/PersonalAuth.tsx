import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Shield, Loader2, Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

interface Gym {
  id: string;
  name: string;
}

export default function PersonalAuth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPersonal, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gymId, setGymId] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"login" | "signup" | "portal_selection">("login");
  const [checkingProfile, setCheckingProfile] = useState(false);

  // Buscar academias do banco
  useEffect(() => {
    const fetchGyms = async () => {
      setLoadingGyms(true);
      console.log("🔍 [PersonalAuth] Iniciando busca de academias...");

      try {
        // Tentar primeiro via RPC
        console.log("📡 [PersonalAuth] Tentando buscar via RPC get_gyms...");
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)("get_gyms");

        console.log("📡 [PersonalAuth] Resposta RPC:", { rpcData, rpcError });

        if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
          console.log("✅ [PersonalAuth] Academias carregadas via RPC:", rpcData);
          setGyms(rpcData.map((g: any) => ({ id: g.id, name: g.name })));
          setLoadingGyms(false);
          return;
        }

        // Tentar via query normal
        console.log("📡 [PersonalAuth] Tentando buscar via query normal...");
        const { data, error } = await supabase.from("gyms").select("id, name").order("name", { ascending: true });

        console.log("📡 [PersonalAuth] Resposta query:", { data, error });

        if (!error && data && Array.isArray(data) && data.length > 0) {
          console.log("✅ [PersonalAuth] Academias carregadas:", data);
          setGyms(data);
          setLoadingGyms(false);
          return;
        }

        // Se ambos falharem
        console.error("❌ [PersonalAuth] Não foi possível carregar academias");
        setGyms([]);
        toast.error("Erro ao carregar portais", {
          description: "Verifique se a tabela foi criada corretamente.",
        });
      } catch (error: any) {
        console.error("❌ [PersonalAuth] Erro:", error);
        setGyms([]);
        toast.error("Erro ao carregar portais");
      } finally {
        setLoadingGyms(false);
      }
    };

    fetchGyms();
  }, []);

  useEffect(() => {
    if (!user?.id || roleLoading) return;
    if (!isPersonal) return;

    const checkAndRedirect = async () => {
      setCheckingProfile(true);
      try {
        const { data: roleRow, error: roleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", user.id)
          .eq("role", "personal")
          .maybeSingle();

        if (roleError || !roleRow) {
          setCheckingProfile(false);
          return;
        }

        const row = roleRow as { approved?: boolean; gym_id?: string };
        if (!row.approved) {
          setCheckingProfile(false);
          return;
        }

        if (row.gym_id) {
          navigate("/app");
          return;
        }

        setStep("portal_selection");
      } catch (e) {
        console.error("Erro ao verificar perfil do personal:", e);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkAndRedirect();
  }, [user?.id, isPersonal, roleLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      await new Promise((resolve) => setTimeout(resolve, 500));

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", data.user.id)
        .eq("role", "personal")
        .maybeSingle();

      if (roleError) {
        await supabase.auth.signOut();
        toast.error("Erro ao verificar permissões", {
          description: roleError.message || "Erro ao consultar o banco de dados. Tente novamente.",
        });
        return;
      }

      const row = roleData as { role?: string; approved?: boolean; gym_id?: string } | null;

      if (!row || row.role !== "personal") {
        await supabase.auth.signOut();
        toast.error("Acesso negado", {
          description: "Esta área é exclusiva para personal trainers.",
        });
        return;
      }

      if (!row.approved) {
        await supabase.auth.signOut();
        toast.warning("Aguardando aprovação", {
          description:
            "Sua conta de personal trainer está aguardando aprovação do administrador. Você receberá um email quando for aprovado.",
          duration: 6000,
        });
        return;
      }

      if (row.gym_id) {
        toast.success("Bem-vindo de volta!", { description: "Login realizado com sucesso." });
        navigate("/app");
      } else {
        setStep("portal_selection");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Erro no login", {
        description: error.message || "Verifique suas credenciais e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePortalSelectAndContinue = async () => {
    if (!gymId.trim() || !user?.id) {
      toast.error("Selecione o portal", { description: "Por favor, selecione o portal." });
      return;
    }
    setLoading(true);
    try {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .eq("role", "personal")
        .maybeSingle();

      const row = roleRow as { approved?: boolean } | null;
      const { error: updateError } = await supabase
        .from("user_roles")
        .update({ gym_id: gymId.trim() } as any)
        .eq("user_id", user.id)
        .eq("role", "personal");

      if (updateError) {
        await supabase.from("user_roles").upsert(
          {
            user_id: user.id,
            role: "personal",
            approved: row?.approved ?? false,
            gym_id: gymId.trim(),
          } as any,
          { onConflict: "user_id,role" },
        );
      }

      await supabase
        .from("profiles")
        .update({ gym_id: gymId.trim() } as any)
        .eq("user_id", user.id);

      toast.success("Portal vinculado!", { description: "Bem-vindo!" });
      navigate("/app");
    } catch (error: any) {
      toast.error("Erro ao salvar portal", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Erro", {
        description: "As senhas não coincidem.",
      });
      return;
    }

    if (password.length < 8) {
      toast.error("Senha muito curta", {
        description: "A senha deve ter no mínimo 8 caracteres.",
      });
      return;
    }

    // Validar força da senha
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      toast.error("Senha muito fraca", {
        description: "A senha deve conter letras maiúsculas, minúsculas e números.",
        duration: 5000,
      });
      return;
    }

    // Validar gym_id no cadastro
    if (!gymId || !gymId.trim()) {
      toast.error("Portal obrigatório", {
        description: "Por favor, selecione o portal.",
      });
      return;
    }

    console.log("✅ [Signup] gym_id validado:", gymId.trim());

    setLoading(true);

    try {
      // Criar usuário
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: `${window.location.origin}/app`,
        },
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Erro ao criar usuário");
      }

      // Verificar se o usuário já existe (identifierExists)
      if (data.user.identities && data.user.identities.length === 0) {
        toast.error("Email já cadastrado", {
          description: "Este email já está em uso. Tente fazer login ou use outro email.",
        });
        return;
      }

      // Aguardar um momento para garantir que a sessão esteja estabelecida e o perfil seja criado pelo trigger
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("🔐 [Signup] Criando role 'personal' para:", data.user.id);
      console.log("🏋️ [Signup] gym_id:", gymId.trim());

      // Tentar usar a função RPC primeiro (mais confiável e contorna políticas RLS)
      // A função aceita _gym_id como parâmetro opcional
      const rpcParams: { _user_id: string; _gym_id?: string } = {
        _user_id: data.user.id,
      };
      if (gymId.trim()) {
        rpcParams._gym_id = gymId.trim();
      }
      // Usar type assertion porque o tipo gerado pode não incluir o parâmetro opcional
      const { error: rpcError } = await (supabase.rpc as any)("create_pending_personal_signup", rpcParams);

      if (rpcError) {
        console.error("❌ Erro ao criar via RPC:", rpcError);
        // Fallback: criar role 'personal' diretamente ANTES de fazer upsert no perfil
        // Isso evita que o trigger crie role 'user' para personal trainers
        const { error: roleError } = await supabase.from("user_roles").upsert(
          {
            user_id: data.user.id,
            role: "personal",
            approved: false,
            gym_id: gymId.trim() || null,
          },
          {
            onConflict: "user_id,role",
          },
        );

        if (roleError) {
          console.error("❌ Erro ao criar role via upsert:", roleError);
          // Tentar inserção direta como último fallback
          const { error: insertError } = await supabase.from("user_roles").insert({
            user_id: data.user.id,
            role: "personal",
            approved: false,
            gym_id: gymId.trim() || null,
          });

          if (insertError) {
            console.error("❌ Erro ao criar role via insert:", insertError);
            throw new Error(`Não foi possível criar a solicitação de personal trainer: ${insertError.message}`);
          } else {
            console.log("✅ Role criada via insert (fallback)");
          }
        } else {
          console.log("✅ Role criada via upsert (fallback)");
        }
      } else {
        console.log("✅ Role criada via RPC com sucesso");
      }

      // Verificar se o registro foi criado corretamente
      const { data: verifyData, error: verifyError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, approved, gym_id")
        .eq("user_id", data.user.id)
        .eq("role", "personal")
        .maybeSingle();

      if (verifyError) {
        console.error("⚠️ Erro ao verificar role criada:", verifyError);
      } else if (verifyData) {
        console.log("✅ Verificação: Role criada com sucesso:", verifyData);
      } else {
        console.error("❌ Verificação: Role NÃO foi criada!");
      }

      // Atualizar o perfil com o nome fornecido (usar upsert para garantir que funcione)
      if (name.trim()) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            user_id: data.user.id,
            name: name.trim(),
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
            .update({ name: name.trim() })
            .eq("user_id", data.user.id);

          if (updateError) {
            console.error("Erro ao atualizar perfil (tentativa 2):", updateError);
            // Não bloquear o cadastro, o nome pode ser atualizado depois
          }
        }
      }

      toast.success("Conta criada com sucesso!", {
        description:
          "Verifique seu email para confirmar o cadastro. Após a confirmação, sua conta ficará aguardando aprovação de um administrador.",
      });

      // Limpar formulário
      setEmail("");
      setPassword("");
      setName("");
      setConfirmPassword("");
      setGymId("");
      setActiveTab("login");
    } catch (error: any) {
      console.error("Signup error:", error);

      let errorMessage = "Não foi possível criar a conta. Tente novamente.";

      if (error.message?.includes("weak") || error.message?.includes("password")) {
        errorMessage =
          "Esta senha é muito fraca ou muito comum. Tente uma senha mais forte com letras maiúsculas, minúsculas, números e caracteres especiais.";
      }

      toast.error("Erro no cadastro", {
        description: errorMessage,
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Link to="/home">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-primary/20 shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-3xl">Área do Personal</CardTitle>
              <CardDescription className="text-base mt-2">Acesso exclusivo para personal trainers</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                {checkingProfile ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  </div>
                ) : step === "portal_selection" ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Selecione o portal em que você atua. Esta escolha não poderá ser alterada depois.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="login-portal">Portal</Label>
                      {loadingGyms ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">Carregando portais...</span>
                        </div>
                      ) : gyms.length > 0 ? (
                        <Select value={gymId} onValueChange={setGymId} disabled={loading}>
                          <SelectTrigger id="login-portal" className="w-full">
                            <SelectValue placeholder="Selecione o portal" />
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
                        <p className="text-xs text-muted-foreground">Nenhum portal cadastrado.</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      size="lg"
                      disabled={loading || loadingGyms || !gymId.trim()}
                      onClick={handlePortalSelectAndContinue}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Continuar
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                          aria-label={showLoginPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Entrar como Personal
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        aria-label={showSignupPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Use letras maiúsculas, minúsculas e números</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repita sua senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-gymId">Portal</Label>
                    {loadingGyms ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Carregando portais...</span>
                      </div>
                    ) : gyms.length > 0 ? (
                      <Select value={gymId} onValueChange={setGymId} disabled={loading || loadingGyms} required>
                        <SelectTrigger id="signup-gymId" className="w-full">
                          <SelectValue placeholder="Selecione o portal" />
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
                          id="signup-gymId"
                          type="text"
                          placeholder="Digite o ID do portal"
                          value={gymId}
                          onChange={(e) => setGymId(e.target.value)}
                          className="pl-10"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Nenhum portal cadastrado. Entre em contato com o administrador.
                        </p>
                      </>
                    )}
                    {!loadingGyms && gyms.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhum portal cadastrado. Entre em contato com o administrador.
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Cadastrar como Personal
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-4 text-xs text-center text-muted-foreground">
                  Ao se cadastrar, você concorda com nossos termos de serviço e política de privacidade.
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-primary/5 rounded-lg p-6 max-w-2xl mx-auto border border-primary/10">
          <h3 className="font-semibold text-lg mb-2">Área Exclusiva para Personal Trainers</h3>
          <p className="text-sm text-muted-foreground">
            Acesse esta área para gerenciar e aprovar treinos gerados pela IA para seus alunos. Garanta a segurança e
            eficácia de cada treino antes de liberar para execução.
          </p>
        </div>
      </div>
    </div>
  );
}
