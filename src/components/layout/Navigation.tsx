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
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 z-50 shadow-[var(--shadow-lg)]">
      <div className="flex justify-around items-center px-4 py-1.5 max-w-lg mx-auto">
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
                "flex flex-col items-center gap-1 h-auto py-2.5 px-2 min-w-[56px] rounded-lg transition-all duration-200",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}