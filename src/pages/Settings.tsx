import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Shield, 
  Smartphone, 
  Moon, 
  Volume2, 
  HelpCircle, 
  MessageSquare, 
  LogOut,
  User,
  Database
} from 'lucide-react';

export default function Settings() {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    nutritionReminders: true,
    waterReminders: true,
    achievements: true,
    weeklyReports: true
  });

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

  const settingsSections = [
    {
      title: "Perfil",
      icon: User,
      items: [
        { label: "Editar perfil", action: () => {}, hasSwitch: false },
        { label: "Alterar senha", action: () => {}, hasSwitch: false },
        { label: "Foto de perfil", action: () => {}, hasSwitch: false }
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
        { label: "Modo escuro", hasSwitch: true, value: false, onChange: () => {} },
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
      
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">
                    {user?.email?.split('@')[0] || 'Usuário'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user?.email || 'usuario@email.com'}
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
    </div>
  );
}