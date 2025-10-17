import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { useStorageUrl } from '@/hooks/useStorageUrl';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  Shield, 
  Smartphone, 
  LogOut,
  User,
  Database,
  Camera,
  Lock,
  HelpCircle
} from 'lucide-react';

export default function Settings() {
  const { signOut, user } = useAuth();
  const { profile, updateProfile, refreshProfile } = useProfile();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  // Get signed URL for avatar display
  const { url: avatarUrl } = useStorageUrl('avatars', profile?.avatar_url || null, 3600);
  
  // Profile edit states
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editDietOpen, setEditDietOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [goal, setGoal] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Dietary preferences
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    nutritionReminders: true,
    waterReminders: true,
    achievements: true,
    weeklyReports: true
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAge(profile.age);
      setGender(profile.gender || '');
      setWeight(profile.weight);
      setHeight(profile.height);
      setGoal(profile.goal || '');
      setExperienceLevel(profile.experience_level || '');
      setDietaryPreferences(profile.dietary_preferences || []);
      setDietaryRestrictions(profile.dietary_restrictions || []);
    }
  }, [profile]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      toast({
        title: "Desconectado",
        description: "Até logo! 👋"
      });
      navigate('/auth');
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível desconectar.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProfile = async () => {
    const { error } = await updateProfile({
      name,
      age,
      gender,
      weight,
      height,
      goal,
      experience_level: experienceLevel
    });

    if (!error) {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso!"
      });
      setEditProfileOpen(false);
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateDietaryInfo = async () => {
    const { error } = await updateProfile({
      dietary_preferences: dietaryPreferences,
      dietary_restrictions: dietaryRestrictions
    });

    if (!error) {
      toast({
        title: "Preferências atualizadas",
        description: "Suas preferências alimentares foram salvas!"
      });
      setEditDietOpen(false);
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as preferências.",
        variant: "destructive"
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Use the file path instead of public URL for private bucket
      const avatarPath = filePath;

      const { error: updateError } = await updateProfile({
        avatar_url: avatarPath
      });

      if (updateError) throw updateError;

      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi alterada com sucesso!"
      });
      
      await refreshProfile();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload da foto.",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso!"
      });
      
      setChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar a senha.",
        variant: "destructive"
      });
    }
  };

  const toggleDietaryPreference = (pref: string) => {
    setDietaryPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const toggleDietaryRestriction = (rest: string) => {
    setDietaryRestrictions(prev => 
      prev.includes(rest) ? prev.filter(r => r !== rest) : [...prev, rest]
    );
  };

  const settingsSections = [
    {
      title: "Perfil",
      icon: User,
      items: [
        { label: "Editar perfil", action: () => setEditProfileOpen(true), hasSwitch: false },
        { label: "Alterar senha", action: () => setChangePasswordOpen(true), hasSwitch: false },
        { label: "Preferências alimentares", action: () => setEditDietOpen(true), hasSwitch: false }
      ]
    },
    {
      title: "Notificações",
      icon: Bell,
      items: [
        { 
          label: "Lembretes de treino", 
          hasSwitch: true, 
          value: notifications.workoutReminders,
          onChange: (value: boolean) => setNotifications({...notifications, workoutReminders: value})
        },
        { 
          label: "Lembretes de nutrição", 
          hasSwitch: true, 
          value: notifications.nutritionReminders,
          onChange: (value: boolean) => setNotifications({...notifications, nutritionReminders: value})
        },
        { 
          label: "Lembretes de hidratação", 
          hasSwitch: true, 
          value: notifications.waterReminders,
          onChange: (value: boolean) => setNotifications({...notifications, waterReminders: value})
        },
        { 
          label: "Conquistas e metas", 
          hasSwitch: true, 
          value: notifications.achievements,
          onChange: (value: boolean) => setNotifications({...notifications, achievements: value})
        },
        { 
          label: "Relatórios semanais", 
          hasSwitch: true, 
          value: notifications.weeklyReports,
          onChange: (value: boolean) => setNotifications({...notifications, weeklyReports: value})
        }
      ]
    },
    {
      title: "Aplicativo",
      icon: Smartphone,
      items: [
        { 
          label: "Modo claro", 
          hasSwitch: true, 
          value: theme === 'light', 
          onChange: (value: boolean) => setTheme(value ? 'light' : 'dark')
        },
        { label: "Sons e vibração", hasSwitch: true, value: true, onChange: () => {} },
        { label: "Idioma", action: () => {}, hasSwitch: false },
        { label: "Unidades de medida", action: () => {}, hasSwitch: false }
      ]
    },
    {
      title: "Privacidade e Segurança",
      icon: Shield,
      items: [
        { label: "Termos de uso", action: () => {}, hasSwitch: false },
        { label: "Política de privacidade", action: () => {}, hasSwitch: false },
        { label: "Gerenciar dados", action: () => {}, hasSwitch: false }
      ]
    },
    {
      title: "Suporte",
      icon: HelpCircle,
      items: [
        { label: "Central de ajuda", action: () => {}, hasSwitch: false },
        { label: "Fale conosco", action: () => {}, hasSwitch: false },
        { label: "Avaliar app", action: () => {}, hasSwitch: false }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header title="Configurações" />
      
      <div className="container mx-auto px-4 py-6 pb-20 max-w-7xl">
        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10">
                        <User className="w-8 h-8 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      <Camera className="w-3 h-3 text-primary-foreground" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">
                      {profile?.name || user?.email?.split('@')[0] || 'Usuário'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user?.email || 'usuario@email.com'}
                    </div>
                    {profile?.goal && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Objetivo: {profile.goal}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Sections */}
          {settingsSections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <section.icon className="w-5 h-5" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <div className="flex items-center justify-between py-2">
                      <Label className="text-sm font-normal cursor-pointer">
                        {item.label}
                      </Label>
                      {item.hasSwitch ? (
                        <Switch
                          checked={item.value || false}
                          onCheckedChange={item.onChange}
                        />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={item.action}
                          className="text-primary hover:text-primary/80"
                        >
                          →
                        </Button>
                      )}
                    </div>
                    {itemIndex < section.items.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* App Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="w-5 h-5" />
                Sobre o App
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Versão do aplicativo</span>
                <span className="text-sm text-muted-foreground">1.0.0</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm">Última atualização</span>
                <span className="text-sm text-muted-foreground">24/01/2024</span>
              </div>
            </CardContent>
          </Card>

          {/* Logout Button */}
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground py-4">
            <p>Meta Fit v1.0.0</p>
            <p>Seu parceiro fitness de confiança</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  value={age || ''}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : null)}
                  placeholder="25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={weight || ''}
                  onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : null)}
                  placeholder="70"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={height || ''}
                  onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : null)}
                  placeholder="175"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Objetivo</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="perder_peso">Perder Peso</SelectItem>
                  <SelectItem value="ganhar_massa">Ganhar Massa Muscular</SelectItem>
                  <SelectItem value="definir">Definir o Corpo</SelectItem>
                  <SelectItem value="manter_forma">Manter a Forma</SelectItem>
                  <SelectItem value="melhorar_saude">Melhorar Saúde</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Nível de Experiência</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdateProfile} className="w-full">
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dietary Preferences Dialog */}
      <Dialog open={editDietOpen} onOpenChange={setEditDietOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preferências Alimentares</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Preferências Dietéticas</Label>
              <div className="space-y-2">
                {['Vegetariana', 'Vegana', 'Low Carb', 'Paleo', 'Mediterrânea', 'Cetogênica'].map((pref) => (
                  <div key={pref} className="flex items-center space-x-2">
                    <Switch
                      checked={dietaryPreferences.includes(pref)}
                      onCheckedChange={() => toggleDietaryPreference(pref)}
                    />
                    <Label className="font-normal cursor-pointer" onClick={() => toggleDietaryPreference(pref)}>
                      {pref}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Label className="text-base font-semibold">Restrições Alimentares</Label>
              <div className="space-y-2">
                {['Lactose', 'Glúten', 'Frutos do mar', 'Nozes', 'Soja', 'Ovo'].map((rest) => (
                  <div key={rest} className="flex items-center space-x-2">
                    <Switch
                      checked={dietaryRestrictions.includes(rest)}
                      onCheckedChange={() => toggleDietaryRestriction(rest)}
                    />
                    <Label className="font-normal cursor-pointer" onClick={() => toggleDietaryRestriction(rest)}>
                      {rest}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Button onClick={handleUpdateDietaryInfo} className="w-full">
              Salvar Preferências
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              A senha deve ter pelo menos 6 caracteres
            </div>
            <Button onClick={handleChangePassword} className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              Alterar Senha
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}