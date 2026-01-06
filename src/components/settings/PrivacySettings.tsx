import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/lib/toast-utils";
import { Download, Trash2, FileText, Shield, AlertTriangle, Pen, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// URL do PDF de termos no Supabase Storage
const TERMS_PDF_STORAGE_URL =
  "https://gztjiknpddlkcxuavoeg.supabase.co/storage/v1/object/public/public-documents/Termo_de_Uso_Profissional_App_Fitnes.pdf";

interface PrivacySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "terms" | "privacy" | "data";
}

export function PrivacySettings({ open, onOpenChange, type }: PrivacySettingsProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Estados para assinatura de PDF
  const [signature, setSignature] = useState("");
  const [isOver18, setIsOver18] = useState(false);
  const [signingPdf, setSigningPdf] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [loadingSignature, setLoadingSignature] = useState(true);
  const [signedSignature, setSignedSignature] = useState<string | null>(null);
  const [signedDate, setSignedDate] = useState<string | null>(null);
  const [termsPdfUrl, setTermsPdfUrl] = useState<string | null>(null);

  // Verificar se o usuário já assinou quando o dialog abrir e carregar URL do PDF
  useEffect(() => {
    if (open && type === "terms") {
      // Carregar URL do PDF do storage
      loadTermsPdfUrl();

      if (user) {
        checkExistingSignature();
      }
    } else if (!open) {
      // Resetar estados quando fechar
      setHasSigned(false);
      setSignedPdfUrl(null);
      setSignedSignature(null);
      setSignedDate(null);
      setTermsPdfUrl(null);
    }
  }, [open, type, user]);

  const loadTermsPdfUrl = async () => {
    // Usar URL direta do storage
    setTermsPdfUrl(TERMS_PDF_STORAGE_URL);
  };

  const checkExistingSignature = async () => {
    if (!user) return;

    setLoadingSignature(true);
    try {
      // Primeiro tentar selecionar todas as colunas (incluindo as novas)
      let { data, error } = await supabase
        .from("user_terms_acceptance")
        .select("signed_pdf_url, signed_pdf_base64, signature, signed_at")
        .eq("user_id", user.id)
        .maybeSingle();

      // Se der erro porque as colunas não existem, tentar apenas com colunas básicas
      if (error && error.message?.includes("does not exist")) {
        console.warn(
          "Colunas de assinatura não encontradas. Execute a migration 20260107000007_add_pdf_signature_fields.sql",
        );
        // Tentar buscar apenas registro básico
        const { data: basicData } = await supabase
          .from("user_terms_acceptance")
          .select("user_id, terms_version, accepted_at")
          .eq("user_id", user.id)
          .maybeSingle();

        // Se existe registro básico mas sem assinatura, não marcar como assinado
        if (basicData) {
          setHasSigned(false);
        }
        setLoadingSignature(false);
        return;
      }

      if (error) throw error;

      // Verificar se tem dados e se tem assinatura
      // Usar type assertion para evitar erros de TypeScript quando as colunas não existem
      if (data && !error) {
        const signatureData = data as any;

        // Verificar se tem algum campo de assinatura
        if (signatureData.signed_pdf_url || signatureData.signed_pdf_base64) {
          setHasSigned(true);
          setSignedSignature(signatureData.signature || null);
          setSignedDate(signatureData.signed_at || null);

          if (signatureData.signed_pdf_url) {
            // Gerar URL assinada do storage
            const { data: signedUrlData } = await supabase.storage
              .from("signed-documents")
              .createSignedUrl(signatureData.signed_pdf_url, 3600);

            if (signedUrlData) {
              setSignedPdfUrl(signedUrlData.signedUrl);
            }
          } else if (signatureData.signed_pdf_base64) {
            // Converter base64 para blob URL
            const binaryString = atob(signatureData.signed_pdf_base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            setSignedPdfUrl(url);
          }
        }
      }
    } catch (error: any) {
      console.error("Erro ao verificar assinatura:", error);
      // Se for erro de coluna não existente, apenas não marcar como assinado
      if (error?.message?.includes("does not exist")) {
        setHasSigned(false);
      }
    } finally {
      setLoadingSignature(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      // Buscar todos os dados do usuário
      const [profileData, workoutsData, mealsData, photosData, measurementsData] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user?.id).maybeSingle(),
        supabase.from("workout_sessions").select("*").eq("user_id", user?.id),
        supabase.from("meal_logs").select("*").eq("user_id", user?.id),
        supabase.from("progress_photos").select("*").eq("user_id", user?.id),
        supabase.from("body_measurements").select("*").eq("user_id", user?.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_email: user?.email,
        profile: profileData.data,
        workouts: workoutsData.data,
        meals: mealsData.data,
        photos: photosData.data,
        measurements: measurementsData.data,
      };

      // Criar arquivo JSON para download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexfit-dados-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast({
        title: "Dados exportados!",
        description: "Seus dados foram baixados com sucesso.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar seus dados.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "EXCLUIR") {
      showToast({
        title: "Confirmação incorreta",
        description: 'Digite "EXCLUIR" para confirmar.',
        variant: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      // Deletar dados do usuário (as RLS policies garantem que apenas dados próprios são deletados)
      await Promise.all([
        supabase.from("workout_sessions").delete().eq("user_id", user?.id),
        supabase.from("meal_logs").delete().eq("user_id", user?.id),
        supabase.from("progress_photos").delete().eq("user_id", user?.id),
        supabase.from("body_measurements").delete().eq("user_id", user?.id),
        supabase.from("profiles").delete().eq("user_id", user?.id),
      ]);

      // Deletar conta de autenticação
      const { error } = await supabase.auth.admin.deleteUser(user?.id || "");

      if (error) throw error;

      showToast({
        title: "Conta excluída",
        description: "Sua conta foi removida permanentemente.",
        variant: "success",
      });

      // Deslogar usuário
      await supabase.auth.signOut();
    } catch (error) {
      showToast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir sua conta. Entre em contato com o suporte.",
        variant: "error",
      });
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSignPdf = async () => {
    if (!signature.trim() || !isOver18) {
      showToast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha sua assinatura e confirme que é maior de 18 anos.",
        variant: "warning",
      });
      return;
    }

    if (!user || !profile) {
      showToast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "error",
      });
      return;
    }

    setSigningPdf(true);
    try {
      // Importar pdf-lib dinamicamente para evitar erros de carregamento
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

      // Carregar o PDF original do storage
      const pdfUrl = TERMS_PDF_STORAGE_URL;
      const response = await fetch(pdfUrl);
      const pdfBytes = await response.arrayBuffer();

      // Carregar o PDF com pdf-lib
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { width, height } = lastPage.getSize();

      // Adicionar assinatura e informações
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;

      // Texto da assinatura
      const signatureText = `Assinado digitalmente por: ${signature}`;
      const dateText = `Data: ${new Date().toLocaleDateString("pt-BR")}`;
      const emailText = `Email: ${user.email}`;
      const over18Text = `Confirmo que sou maior de 18 anos`;

      // Calcular posição (parte inferior da página)
      const yPosition = 100;
      const lineHeight = 20;

      lastPage.drawText(signatureText, {
        x: 50,
        y: yPosition + lineHeight * 3,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });

      lastPage.drawText(dateText, {
        x: 50,
        y: yPosition + lineHeight * 2,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });

      lastPage.drawText(emailText, {
        x: 50,
        y: yPosition + lineHeight,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });

      lastPage.drawText(over18Text, {
        x: 50,
        y: yPosition,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });

      // Salvar PDF assinado
      const signedPdfBytes = await pdfDoc.save();

      // Fazer upload para Supabase Storage (com user_id como pasta)
      const fileName = `${user.id}/termo-assinado-${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("signed-documents")
        .upload(fileName, signedPdfBytes, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        // Se o bucket não existir, criar um fallback: salvar no banco como blob
        console.error("Erro ao fazer upload:", uploadError);

        // Converter para base64 e salvar na tabela user_terms_acceptance
        const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(signedPdfBytes)));

        const { error: dbError } = await supabase.from("user_terms_acceptance").upsert(
          {
            user_id: user.id,
            terms_version: "1.0.0",
            signed_pdf_base64: base64Pdf,
            signed_at: new Date().toISOString(),
            signature: signature,
            is_over_18: true,
          },
          {
            onConflict: "user_id",
          },
        );

        if (dbError) throw dbError;
      } else {
        // Se o upload funcionou, salvar referência no banco
        const { error: dbError } = await supabase.from("user_terms_acceptance").upsert(
          {
            user_id: user.id,
            terms_version: "1.0.0",
            signed_pdf_url: uploadData.path,
            signed_at: new Date().toISOString(),
            signature: signature,
            is_over_18: true,
          },
          {
            onConflict: "user_id",
          },
        );

        if (dbError) throw dbError;
      }

      showToast({
        title: "PDF assinado com sucesso!",
        description: "O termo assinado foi salvo com sucesso.",
        variant: "success",
      });

      // Marcar como assinado e atualizar URL
      setHasSigned(true);
      setSignedSignature(signature);
      setSignedDate(new Date().toISOString());

      // Atualizar URL do PDF assinado
      if (uploadData) {
        const { data: signedUrlData } = await supabase.storage
          .from("signed-documents")
          .createSignedUrl(uploadData.path, 3600);

        if (signedUrlData) {
          setSignedPdfUrl(signedUrlData.signedUrl);
        }
      } else {
        // Se salvou em base64, converter para blob URL
        const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(signedPdfBytes)));
        const binaryString = atob(base64Pdf);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setSignedPdfUrl(url);
      }

      // Limpar campos
      setSignature("");
      setIsOver18(false);
    } catch (error: any) {
      console.error("Erro ao assinar PDF:", error);
      showToast({
        title: "Erro ao assinar PDF",
        description: error.message || "Não foi possível assinar o PDF.",
        variant: "error",
      });
    } finally {
      setSigningPdf(false);
    }
  };

  const renderTermsContent = () => {
    if (loadingSignature) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
      );
    }

    // Se já assinou, mostrar apenas o PDF assinado
    if (hasSigned && signedPdfUrl) {
      return (
        <div className="space-y-4">
          <Card className="border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Shield className="w-5 h-5" />
                Termo Assinado
              </CardTitle>
              <CardDescription>Seu termo foi assinado e salvo com sucesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {signedSignature && (
                <p className="text-sm">
                  <span className="font-semibold">Assinado por:</span> {signedSignature}
                </p>
              )}
              {signedDate && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Data:</span>{" "}
                  {new Date(signedDate).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Visualizador de PDF Assinado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Termo de Uso Assinado
              </CardTitle>
              <CardDescription>Documento assinado digitalmente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <iframe src={signedPdfUrl} className="w-full h-[600px]" title="Termo de Uso PDF Assinado" />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Se não assinou, mostrar formulário de assinatura
    return (
      <div className="space-y-4">
        {/* Visualizador de PDF Original */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Termo de Uso Profissional
            </CardTitle>
            <CardDescription>Leia o documento completo antes de assinar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <iframe src={TERMS_PDF_STORAGE_URL} className="w-full h-[500px]" title="Termo de Uso PDF" />
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Assinatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pen className="w-5 h-5" />
              Assinar Termo
            </CardTitle>
            <CardDescription>
              Se você for maior de 18 anos, assine para liberar o app para usar sem personal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signature">Sua Assinatura (Nome Completo)</Label>
              <Input
                id="signature"
                type="text"
                placeholder="Digite seu nome completo"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                disabled={signingPdf}
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="over18"
                checked={isOver18}
                onCheckedChange={(checked) => setIsOver18(checked as boolean)}
                disabled={signingPdf}
              />
              <Label
                htmlFor="over18"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Confirmo que sou maior de 18 anos e tenho capacidade legal para assinar este termo
              </Label>
            </div>

            <Button onClick={handleSignPdf} disabled={signingPdf || !signature.trim() || !isOver18} className="w-full">
              {signingPdf ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-spin" />
                  Assinando e salvando...
                </>
              ) : (
                <>
                  <Pen className="w-4 h-4 mr-2" />
                  Assinar e Salvar PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPrivacyContent = () => (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">1. Informações Coletadas</h3>
          <p className="text-sm text-muted-foreground">
            Coletamos informações que você fornece diretamente: nome, email, dados físicos (peso, altura), fotos de
            progresso, logs de treino e alimentação.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-lg mb-2">2. Como Usamos Seus Dados</h3>
          <p className="text-sm text-muted-foreground">
            Utilizamos seus dados para: fornecer serviços personalizados, gerar insights com IA, acompanhar seu
            progresso e melhorar nossos serviços.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-lg mb-2">3. Compartilhamento de Dados</h3>
          <p className="text-sm text-muted-foreground">
            Não vendemos seus dados. Compartilhamos apenas com serviços essenciais (hospedagem, IA) sob acordos de
            confidencialidade.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-lg mb-2">4. Segurança</h3>
          <p className="text-sm text-muted-foreground">
            Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não
            autorizado.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-lg mb-2">5. Seus Direitos</h3>
          <p className="text-sm text-muted-foreground">
            Você pode acessar, corrigir, exportar ou excluir seus dados a qualquer momento através das configurações do
            app.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-lg mb-2">6. Cookies e Tecnologias Similares</h3>
          <p className="text-sm text-muted-foreground">
            Utilizamos cookies e armazenamento local para melhorar sua experiência e manter você conectado.
          </p>
        </div>
      </div>
    </ScrollArea>
  );

  const renderDataManagement = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Dados
          </CardTitle>
          <CardDescription>Baixe todos os seus dados em formato JSON</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Você receberá um arquivo com todas as suas informações: perfil, treinos, refeições, fotos e medições.
          </p>
          <Button onClick={handleExportData} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            {loading ? "Exportando..." : "Exportar Meus Dados"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>Ações irreversíveis que afetam sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Excluir sua conta removerá permanentemente todos os seus dados. Esta ação não pode ser desfeita.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir Conta Permanentemente
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão de Conta
            </DialogTitle>
            <DialogDescription>
              Esta ação é permanente e não pode ser desfeita. Todos os seus dados serão removidos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              Para confirmar, digite <strong>EXCLUIR</strong> no campo abaixo:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Digite EXCLUIR"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={loading || deleteConfirm !== "EXCLUIR"}
            >
              {loading ? "Excluindo..." : "Excluir Minha Conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={type === "terms" ? "max-w-5xl max-h-[95vh]" : "max-w-3xl max-h-[90vh]"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {type === "terms" && "Termos de Uso"}
            {type === "privacy" && "Política de Privacidade"}
            {type === "data" && "Gerenciar Dados"}
          </DialogTitle>
        </DialogHeader>
        <div className={type === "terms" ? "py-4 overflow-y-auto max-h-[85vh]" : "py-4"}>
          {type === "terms" && renderTermsContent()}
          {type === "privacy" && renderPrivacyContent()}
          {type === "data" && renderDataManagement()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
