import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Copy, Check, ExternalLink, Trash2, X, Mail, UserPlus, Lock, Globe } from 'lucide-react';

interface ShareWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutPlanId: string;
  workoutName: string;
}

interface ShareLink {
  id: string;
  share_token: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
  is_private: boolean;
  view_count: number;
  created_at: string;
}

interface Invite {
  id: string;
  invited_email: string;
  accepted: boolean;
}

export function ShareWorkoutModal({ open, onOpenChange, workoutPlanId, workoutName }: ShareWorkoutModalProps) {
  const [title, setTitle] = useState(workoutName);
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invites, setInvites] = useState<Record<string, Invite[]>>({});

  useEffect(() => {
    if (open) {
      loadShares();
    } else {
      // Reset on close
      setDescription('');
      setInviteEmail('');
      setIsPrivate(true);
    }
  }, [open]);

  const loadShares = async () => {
    const { data } = await supabase
      .from('workout_shares')
      .select('*')
      .eq('workout_plan_id', workoutPlanId)
      .order('created_at', { ascending: false });

    if (data) {
      setShareLinks(data);
      // Load invites for each private share
      data.forEach(share => {
        if (share.is_private) {
          loadInvites(share.id);
        }
      });
    }
  };

  const loadInvites = async (shareId: string) => {
    const { data } = await supabase
      .from('workout_share_invites')
      .select('id, invited_email, accepted')
      .eq('share_id', shareId);

    if (data) {
      setInvites(prev => ({ ...prev, [shareId]: data }));
    }
  };

  const createShareLink = async () => {
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado');
        return;
      }

      // Generate unique token
      const token = await generateUniqueToken();

      const { data, error } = await supabase
        .from('workout_shares')
        .insert([{
          workout_plan_id: workoutPlanId,
          shared_by: user.id,
          share_token: token,
          title: title || workoutName,
          description: description || null,
          is_active: true,
          is_private: isPrivate
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success(isPrivate ? 'Compartilhamento privado criado!' : 'Link público criado!');
      setShareLinks([data, ...shareLinks]);
      setDescription('');
      
      // Copy link automatically
      copyToClipboard(token);
    } catch (error) {
      console.error('Error creating share link:', error);
      toast.error('Erro ao criar link de compartilhamento');
    } finally {
      setIsCreating(false);
    }
  };

  const generateUniqueToken = async (): Promise<string> => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    let isUnique = false;

    while (!isUnique) {
      token = '';
      for (let i = 0; i < 12; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const { data } = await supabase
        .from('workout_shares')
        .select('id')
        .eq('share_token', token)
        .maybeSingle();

      if (!data) {
        isUnique = true;
      }
    }

    return token;
  };

  const addInvite = async (shareId: string) => {
    const email = inviteEmail.trim().toLowerCase();
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email inválido');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('workout_share_invites')
        .insert({
          share_id: shareId,
          invited_email: email,
          invited_by: user.id
        })
        .select('id, invited_email, accepted')
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Este email já foi convidado');
        } else {
          throw error;
        }
        return;
      }

      toast.success(`Convite enviado para ${email}`);
      setInvites(prev => ({
        ...prev,
        [shareId]: [...(prev[shareId] || []), data]
      }));
      setInviteEmail('');
    } catch (error: any) {
      console.error('Error adding invite:', error);
      toast.error('Erro ao adicionar convite');
    }
  };

  const removeInvite = async (inviteId: string, shareId: string) => {
    const { error } = await supabase
      .from('workout_share_invites')
      .delete()
      .eq('id', inviteId);

    if (error) {
      toast.error('Erro ao remover convite');
      return;
    }

    setInvites(prev => ({
      ...prev,
      [shareId]: prev[shareId].filter(inv => inv.id !== inviteId)
    }));
    toast.success('Convite removido');
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const toggleShareActive = async (shareId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('workout_shares')
      .update({ is_active: !currentState })
      .eq('id', shareId);

    if (error) {
      toast.error('Erro ao atualizar compartilhamento');
      return;
    }

    setShareLinks(shareLinks.map(link => 
      link.id === shareId ? { ...link, is_active: !currentState } : link
    ));
    toast.success(currentState ? 'Link desativado' : 'Link ativado');
  };

  const deleteShare = async (shareId: string) => {
    const { error } = await supabase
      .from('workout_shares')
      .delete()
      .eq('id', shareId);

    if (error) {
      toast.error('Erro ao deletar compartilhamento');
      return;
    }

    setShareLinks(shareLinks.filter(link => link.id !== shareId));
    toast.success('Link deletado');
  };

  const openInNewTab = (token: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Treino
          </DialogTitle>
          <DialogDescription>
            Compartilhe de forma privada com pessoas específicas ou crie um link público
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Share */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {isPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  <Label className="text-base font-semibold">
                    {isPrivate ? 'Compartilhamento Privado' : 'Compartilhamento Público'}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isPrivate 
                    ? 'Apenas pessoas convidadas podem acessar' 
                    : 'Qualquer pessoa com o link pode acessar'}
                </p>
              </div>
              <Switch
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título do Compartilhamento</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={workoutName}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione informações sobre este treino..."
                rows={3}
              />
            </div>

            <Button 
              onClick={createShareLink} 
              disabled={isCreating || !title}
              className="w-full"
            >
              <Share2 className="mr-2 h-4 w-4" />
              {isCreating ? 'Criando...' : isPrivate ? 'Criar Compartilhamento Privado' : 'Criar Link Público'}
            </Button>
          </div>

          {/* Existing Shares */}
          {shareLinks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Compartilhamentos Criados ({shareLinks.length})</h3>
              <div className="space-y-3">
                {shareLinks.map((link) => (
                  <div 
                    key={link.id} 
                    className={`p-4 rounded-lg border ${
                      link.is_active ? 'bg-background' : 'bg-muted/50 opacity-60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {link.is_private ? (
                              <Lock className="w-4 h-4 text-primary" />
                            ) : (
                              <Globe className="w-4 h-4 text-muted-foreground" />
                            )}
                            <h4 className="font-medium truncate">{link.title}</h4>
                            {link.is_active ? (
                              <Badge variant="default" className="text-xs">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Inativo</Badge>
                            )}
                            {link.is_private && (
                              <Badge variant="outline" className="text-xs">Privado</Badge>
                            )}
                          </div>
                          
                          {link.description && (
                            <p className="text-sm text-muted-foreground mb-2">{link.description}</p>
                          )}

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{link.view_count} visualizações</span>
                            <span>•</span>
                            <span>Criado em {new Date(link.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <Input
                              value={`${window.location.origin}/shared/${link.share_token}`}
                              readOnly
                              className="text-xs h-8"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(link.share_token)}
                              className="shrink-0"
                            >
                              {copiedToken === link.share_token ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openInNewTab(link.share_token)}
                              className="shrink-0"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Switch
                            checked={link.is_active}
                            onCheckedChange={() => toggleShareActive(link.id, link.is_active)}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteShare(link.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* Private Share - Invites Section */}
                      {link.is_private && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <Label className="flex items-center gap-2 text-sm">
                            <UserPlus className="w-4 h-4" />
                            Pessoas Convidadas
                          </Label>
                          
                          <div className="flex gap-2">
                            <Input
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="email@exemplo.com"
                              className="h-8 text-sm"
                              onKeyPress={(e) => e.key === 'Enter' && addInvite(link.id)}
                            />
                            <Button 
                              size="sm" 
                              onClick={() => addInvite(link.id)}
                              disabled={!inviteEmail.trim()}
                            >
                              <Mail className="w-4 h-4 mr-1" />
                              Convidar
                            </Button>
                          </div>

                          {invites[link.id] && invites[link.id].length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">
                                {invites[link.id].length} pessoa(s) convidada(s)
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {invites[link.id].map((invite) => (
                                  <Badge key={invite.id} variant="secondary" className="gap-2">
                                    {invite.invited_email}
                                    {invite.accepted && <Check className="w-3 h-3 text-green-600" />}
                                    <button
                                      onClick={() => removeInvite(invite.id, link.id)}
                                      className="hover:text-destructive"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
