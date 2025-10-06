import { Bell, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  title: string;
  showProfile?: boolean;
}

export function Header({ title, showProfile = true }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
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

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-border/50 shadow-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg animate-pulse-glow">
              <span className="text-primary-foreground font-bold text-base">MF</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              {title}
            </h1>
          </div>
        </div>
        
        {showProfile && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center animate-pulse">
                <span className="w-2 h-2 bg-primary-foreground rounded-full"></span>
              </span>
            </Button>
            {user && (
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair" className="hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="w-5 h-5" />
              </Button>
            )}
            <Avatar className="w-9 h-9 ring-2 ring-primary/20 ring-offset-2 hover:ring-primary/50 transition-all">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold">
                {user?.user_metadata?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </header>
  );
}