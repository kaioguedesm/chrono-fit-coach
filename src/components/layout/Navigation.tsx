import { Home, User, Dumbbell, Calendar, Apple, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  { id: "dashboard", label: "Início", icon: Home },
  { id: "profile", label: "Perfil", icon: User },
  { id: "workout", label: "Treino", icon: Dumbbell },
  { id: "schedule", label: "Agenda", icon: Calendar },
  { id: "nutrition", label: "Nutrição", icon: Apple },
  { id: "progress", label: "Progresso", icon: BarChart3 },
  { id: "settings", label: "Config", icon: Settings },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 z-50 shadow-2xl">
      <div className="flex justify-around items-center px-2 py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-3 px-3 min-w-[60px] rounded-xl transition-all duration-300 relative",
                isActive 
                  ? "text-primary bg-gradient-to-br from-primary/15 to-secondary/15 shadow-lg scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/10 hover:scale-105"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
              )}
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "animate-float")} />
              <span className="text-xs font-semibold">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}