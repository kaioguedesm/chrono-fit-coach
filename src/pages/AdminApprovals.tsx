import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, CheckCircle, XCircle, Clock, Loader2, Mail, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface PendingPersonal {
  id: string;
  user_id: string;
  role: "admin" | "personal" | "user";
  approved: boolean;
  created_at: string;
  profiles?: {
    name: string;
    email?: string;
  };
}

export default function AdminApprovals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingPersonals, setPendingPersonals] = useState<PendingPersonal[]>([]);
  const [selectedPersonal, setSelectedPersonal] = useState<PendingPersonal | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingPersonals();
  }, []);

  const fetchPendingPersonals = async () => {
    try {
      setLoading(true);

      console.log("🔍 Buscando personal trainers pendentes de aprovação...");

      // Buscar user_roles pendentes de aprovação
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, approved, created_at")
        .eq("role", "personal")
        .eq("approved", false)
        .order("created_at", { ascending: false });

      if (rolesError) {
        console.error("❌ Erro ao buscar user_roles:", rolesError);
        throw rolesError;
      }

      console.log("📊 Registros encontrados em user_roles:", rolesData?.length || 0);

      // Se não encontrar em user_roles, buscar em pending_personal_signups como fallback
      let allUserIds: string[] = [];

      if (rolesData && rolesData.length > 0) {
        allUserIds = rolesData.map((r) => r.user_id);
      } else {
        console.log("⚠️ Nenhum registro em user_roles, buscando em pending_personal_signups...");
        const { data: pendingData, error: pendingError } = await supabase
          .from("pending_personal_signups")
          .select("user_id, created_at")
          .order("created_at", { ascending: false });

        if (!pendingError && pendingData) {
          console.log("📊 Registros encontrados em pending_personal_signups:", pendingData.length);
          // Converter para o formato esperado
          const convertedRoles: PendingPersonal[] = pendingData.map((p) => ({
            id: `pending_${p.user_id}`, // ID temporário
            user_id: p.user_id,
            role: "personal" as const,
            approved: false,
            created_at: p.created_at,
          }));

          // Adicionar aos rolesData
          allUserIds = convertedRoles.map((r) => r.user_id);
          if (rolesData) {
            rolesData.push(...convertedRoles);
          } else {
            // Se rolesData for null, criar novo array
            const newRolesData = convertedRoles;
            // Buscar perfis
            if (allUserIds.length > 0) {
              const { data: profilesData, error: profilesError } = await supabase
                .from("profiles")
                .select("user_id, name")
                .in("user_id", allUserIds);

              if (profilesError) throw profilesError;

              const combined = newRolesData.map((role) => ({
                ...role,
                profiles: profilesData?.find((p) => p.user_id === role.user_id),
              }));

              setPendingPersonals(combined);
              return;
            }
          }
        }
      }

      // Buscar perfis dos usuários
      if (allUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, name")
          .in("user_id", allUserIds);

        if (profilesError) {
          console.error("❌ Erro ao buscar perfis:", profilesError);
          throw profilesError;
        }

        console.log("👤 Perfis encontrados:", profilesData?.length || 0);

        // Combinar dados
        const combined = (rolesData || []).map((role) => ({
          ...role,
          profiles: profilesData?.find((p) => p.user_id === role.user_id),
        }));

        console.log("✅ Total de personais pendentes:", combined.length);
        setPendingPersonals(combined);
      } else {
        console.log("ℹ️ Nenhum personal trainer pendente encontrado");
        setPendingPersonals([]);
      }
    } catch (error: any) {
      console.error("❌ Error fetching pending personals:", error);
      toast.error("Erro ao carregar aprovações pendentes", {
        description: error.message || "Verifique o console para mais detalhes",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (personal: PendingPersonal) => {
    try {
      setActionLoading(true);

      // Obter o ID do usuário atual (admin que está aprovando)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Se o ID começar com "pending_", significa que veio de pending_personal_signups
      // Nesse caso, criar o registro em user_roles primeiro
      if (personal.id.startsWith("pending_")) {
        const { error: createError } = await supabase
          .from("user_roles")
          .insert({
            user_id: personal.user_id,
            role: "personal",
            approved: true,
            approved_at: new Date().toISOString(),
            approved_by: user.id,
          })
          .select()
          .single();

        if (createError) {
          // Se já existir, apenas atualizar
          const { error: updateError } = await supabase
            .from("user_roles")
            .update({
              approved: true,
              approved_at: new Date().toISOString(),
              approved_by: user.id,
            })
            .eq("user_id", personal.user_id)
            .eq("role", "personal");

          if (updateError) throw updateError;
        }

        // Remover de pending_personal_signups
        await supabase.from("pending_personal_signups").delete().eq("user_id", personal.user_id);
      } else {
        // Atualizar registro existente em user_roles
        const { error } = await supabase
          .from("user_roles")
          .update({
            approved: true,
            approved_at: new Date().toISOString(),
            approved_by: user.id,
          })
          .eq("id", personal.id);

        if (error) throw error;
      }

      toast.success("Personal aprovado!", {
        description: `${personal.profiles?.name} foi aprovado com sucesso.`,
      });

      fetchPendingPersonals();
    } catch (error: any) {
      console.error("Error approving personal:", error);
      toast.error("Erro ao aprovar personal", {
        description: error.message || "Não foi possível aprovar o personal trainer.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPersonal) return;

    try {
      setActionLoading(true);

      // Se o ID começar com "pending_", apenas remover de pending_personal_signups
      if (selectedPersonal.id.startsWith("pending_")) {
        await supabase.from("pending_personal_signups").delete().eq("user_id", selectedPersonal.user_id);

        // Também remover de user_roles se existir
        await supabase.from("user_roles").delete().eq("user_id", selectedPersonal.user_id).eq("role", "personal");
      } else {
        // Atualizar com motivo da rejeição e depois deletar
        const { error } = await supabase
          .from("user_roles")
          .update({
            rejection_reason: rejectionReason,
          })
          .eq("id", selectedPersonal.id);

        if (error) throw error;

        // Deletar o registro
        await supabase.from("user_roles").delete().eq("id", selectedPersonal.id);
      }

      toast.success("Personal rejeitado", {
        description: "A conta foi rejeitada e removida.",
      });

      setShowRejectDialog(false);
      setSelectedPersonal(null);
      setRejectionReason("");
      fetchPendingPersonals();
    } catch (error: any) {
      console.error("Error rejecting personal:", error);
      toast.error("Erro ao rejeitar personal", {
        description: error.message || "Não foi possível rejeitar o personal trainer.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (personal: PendingPersonal) => {
    setSelectedPersonal(personal);
    setShowRejectDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Admin" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Aprovações de Personal Trainers</h1>
              <p className="text-muted-foreground">Gerencie solicitações de cadastro de personal trainers</p>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold">{pendingPersonals.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Pendentes */}
          <div className="space-y-4">
            {pendingPersonals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                  <p className="text-lg font-medium mb-2">Nenhuma aprovação pendente</p>
                  <p className="text-sm text-muted-foreground">Todas as solicitações foram processadas</p>
                </CardContent>
              </Card>
            ) : (
              pendingPersonals.map((personal) => (
                <Card key={personal.id} className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {personal.profiles?.name || "Usuário sem nome"}
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="w-3 h-3" />
                            Pendente
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Solicitado em: {new Date(personal.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button onClick={() => handleApprove(personal)} disabled={actionLoading} className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Aprovar
                      </Button>
                      <Button
                        onClick={() => openRejectDialog(personal)}
                        disabled={actionLoading}
                        variant="destructive"
                        className="gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dialog de Rejeição */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar solicitação?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a rejeitar a solicitação de {selectedPersonal?.profiles?.name}. Essa ação removerá a
              conta do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-4">
            <label className="text-sm font-medium">Motivo da rejeição (opcional)</label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Descreva o motivo da rejeição..."
              className="min-h-[100px]"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejeitando...
                </>
              ) : (
                "Confirmar Rejeição"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
