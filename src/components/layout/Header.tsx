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
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-[var(--shadow-sm)]">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[var(--shadow-xs)]">
              <span className="text-primary-foreground font-bold text-sm">MF</span>
            </div>
            <h1 className="text-lg font-bold text-foreground">
              {title}
            </h1>
          </div>
        </div>
        
        {showProfile && (
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </Button>
            {user && (
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair" className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="w-4 h-4" />
              </Button>
            )}
            <Avatar className="w-8 h-8 ring-1 ring-border">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                {user?.user_metadata?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </header>
  );
}