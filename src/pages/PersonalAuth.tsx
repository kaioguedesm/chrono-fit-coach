import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Shield, Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PersonalAuth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPersonal, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // Se já estiver logado como personal, redireciona
    if (user && !roleLoading && isPersonal) {
      navigate("/app");
    }
  }, [user, isPersonal, roleLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Aguardar um momento para garantir que a sessão esteja completamente estabelecida
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verificar se o usuário é personal trainer e está aprovado
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role, approved")
        .eq("user_id", data.user.id)
        .eq("role", "personal")
        .maybeSingle();

      if (roleError) {
        console.error("Role query error:", roleError);
        console.error("Role query details:", {
          code: roleError.code,
          message: roleError.message,
          details: roleError.details,
          hint: roleError.hint,
        });
        await supabase.auth.signOut();
        toast.error("Erro ao verificar permissões", {
          description: roleError.message || "Erro ao consultar o banco de dados. Tente novamente.",
        });
        return;
      }

      if (!roleData || roleData.role !== "personal") {
        // Se não for personal, faz logout
        await supabase.auth.signOut();
        toast.error("Acesso negado", {
          description: "Esta área é exclusiva para personal trainers.",
        });
        return;
      }

      // Verificar se o personal foi aprovado
      if (!roleData.approved) {
        await supabase.auth.signOut();
        toast.warning("Aguardando aprovação", {
          description:
            "Sua conta de personal trainer está aguardando aprovação do administrador. Você receberá um email quando for aprovado.",
          duration: 6000,
        });
        return;
      }

      toast.success("Bem-vindo de volta!", {
        description: "Login realizado com sucesso.",
      });

      navigate("/app");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Erro no login", {
        description: error.message || "Verifique suas credenciais e tente novamente.",
      });
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

      // Registrar solicitação de personal trainer (será processada após confirmação de email)
      // Tentar inserir diretamente primeiro
      let pendingError = null;
      const { error: directInsertError } = await supabase.from("pending_personal_signups").insert({
        user_id: data.user.id,
      });

      if (directInsertError) {
        // Se falhar, usar a função do banco de dados (SECURITY DEFINER)
        const { error: functionError } = await supabase.rpc("create_pending_personal_signup", {
          _user_id: data.user.id,
        });

        if (functionError) {
          pendingError = functionError;
          console.error("Erro ao criar pending signup:", functionError);

          // Como último recurso, tentar criar o role diretamente
          // Isso pode acontecer se o trigger não funcionar ou se houver problemas de RLS
          const { error: roleError } = await supabase.from("user_roles").insert({
            user_id: data.user.id,
            role: "personal",
            approved: false,
          });

          if (roleError) {
            console.error("Erro ao criar role diretamente:", roleError);
            // Não bloquear o cadastro, o admin pode criar o role manualmente se necessário
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
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
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
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={8}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Use letras maiúsculas, minúsculas e números</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Repita sua senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
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
