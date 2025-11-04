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
    <nav className="fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur-xl border-t border-border/50 z-[100] shadow-lg pb-safe safe-area-bottom">
      <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
        <div className="flex items-center gap-1 px-2 py-2 min-w-max">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 h-auto py-3 px-4 min-w-[70px] rounded-xl transition-all duration-200 flex-shrink-0",
                  "active:scale-95 touch-manipulation will-change-transform",
                  isActive 
                    ? "text-primary bg-primary/10 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("text-[11px] font-medium whitespace-nowrap", isActive && "font-semibold")}>
                  {item.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}