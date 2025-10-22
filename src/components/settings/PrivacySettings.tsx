import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/lib/toast-utils';
import { Download, Trash2, FileText, Shield, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PrivacySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'terms' | 'privacy' | 'data';
}

export function PrivacySettings({ open, onOpenChange, type }: PrivacySettingsProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleExportData = async () => {
    setLoading(true);
    try {
      // Buscar todos os dados do usuário
      const [profileData, workoutsData, mealsData, photosData, measurementsData] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user?.id).single(),
        supabase.from('workout_sessions').select('*').eq('user_id', user?.id),
        supabase.from('meal_logs').select('*').eq('user_id', user?.id),
        supabase.from('progress_photos').select('*').eq('user_id', user?.id),
        supabase.from('body_measurements').select('*').eq('user_id', user?.id)
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_email: user?.email,
        profile: profileData.data,
        workouts: workoutsData.data,
        meals: mealsData.data,
        photos: photosData.data,
        measurements: measurementsData.data
      };

      // Criar arquivo JSON para download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexfit-dados-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast({
        title: 'Dados exportados!',
        description: 'Seus dados foram baixados com sucesso.',
        variant: 'success'
      });
    } catch (error) {
      showToast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar seus dados.',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'EXCLUIR') {
      showToast({
        title: 'Confirmação incorreta',
        description: 'Digite "EXCLUIR" para confirmar.',
        variant: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      // Deletar dados do usuário (as RLS policies garantem que apenas dados próprios são deletados)
      await Promise.all([
        supabase.from('workout_sessions').delete().eq('user_id', user?.id),
        supabase.from('meal_logs').delete().eq('user_id', user?.id),
        supabase.from('progress_photos').delete().eq('user_id', user?.id),
        supabase.from('body_measurements').delete().eq('user_id', user?.id),
        supabase.from('profiles').delete().eq('user_id', user?.id)
      ]);

      // Deletar conta de autenticação
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '');
      
      if (error) throw error;

      showToast({
        title: 'Conta excluída',
        description: 'Sua conta foi removida permanentemente.',
        variant: 'success'
      });

      // Deslogar usuário
      await supabase.auth.signOut();
    } catch (error) {
      showToast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir sua conta. Entre em contato com o suporte.',
        variant: 'error'
      });
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const renderTermsContent = () => (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">1. Aceitação dos Termos</h3>
          <p className="text-sm text-muted-foreground">
            Ao utilizar o Nex Fit, você concorda com estes termos de uso. Se não concordar, não utilize o aplicativo.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-lg mb-2">2. Uso do Serviço</h3>
          <p className="text-sm text-muted-foreground">
            O Nex Fit é uma plataforma de acompanhamento fitness. Você é responsável por manter a confidencialidade de sua conta e senha.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-lg mb-2">3. Conteúdo do Usuário</h3>
          <p className="text-sm text-muted-foreground">
            Você mantém todos os direitos sobre o conteúdo que envia. No entanto, concede-nos uma licença para armazená-lo e processá-lo para fornecer nossos serviços.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-lg mb-2">4. Isenção de Responsabilidade</h3>
          <p className="text-sm text-muted-foreground">
            O Nex Fit não substitui orientação médica profissional. Consulte um médico antes de iniciar qualquer programa de exercícios ou dieta.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-lg mb-2">5. Modificações</h3>
          <p className="text-sm text-muted-foreground">
            Reservamos o direito de modificar estes termos a qualquer momento. Notificaremos sobre mudanças significativas.
          </p>
        </div>
      </div>
    </ScrollArea>
  );

  const renderPrivacyContent = () => (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">1. Informações Coletadas</h3>
          <p className="text-sm text-muted-foreground">
            Coletamos informações que você fornece diretamente: nome, email, dados físicos (peso, altura), fotos de progresso, logs de treino e alimentação.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-lg mb-2">2. Como Usamos Seus Dados</h3>
          <p className="text-sm text-muted-foreground">
            Utilizamos seus dados para: fornecer serviços personalizados, gerar insights com IA, acompanhar seu progresso e melhorar nossos serviços.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-lg mb-2">3. Compartilhamento de Dados</h3>
          <p className="text-sm text-muted-foreground">
            Não vendemos seus dados. Compartilhamos apenas com serviços essenciais (hospedagem, IA) sob acordos de confidencialidade.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-lg mb-2">4. Segurança</h3>
          <p className="text-sm text-muted-foreground">
            Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado.
          </p>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-lg mb-2">5. Seus Direitos</h3>
          <p className="text-sm text-muted-foreground">
            Você pode acessar, corrigir, exportar ou excluir seus dados a qualquer momento através das configurações do app.
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
          <CardDescription>
            Baixe todos os seus dados em formato JSON
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Você receberá um arquivo com todas as suas informações: perfil, treinos, refeições, fotos e medições.
          </p>
          <Button onClick={handleExportData} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Exportando...' : 'Exportar Meus Dados'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Excluir sua conta removerá permanentemente todos os seus dados. Esta ação não pode ser desfeita.
            </AlertDescription>
          </Alert>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
          >
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
              disabled={loading || deleteConfirm !== 'EXCLUIR'}
            >
              {loading ? 'Excluindo...' : 'Excluir Minha Conta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {type === 'terms' && 'Termos de Uso'}
            {type === 'privacy' && 'Política de Privacidade'}
            {type === 'data' && 'Gerenciar Dados'}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {type === 'terms' && renderTermsContent()}
          {type === 'privacy' && renderPrivacyContent()}
          {type === 'data' && renderDataManagement()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
