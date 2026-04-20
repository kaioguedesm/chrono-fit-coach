import { Dumbbell, Apple, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isPersonal?: boolean;
}

const userNavigationItems = [
  { id: "dashboard", label: "Treino", icon: Dumbbell },
  { id: "diet", label: "Dieta", icon: Apple },
  { id: "profile", label: "Perfil", icon: User },
];

const personalItem = { id: "personal", label: "Personal", icon: Shield };

export function Navigation({ activeTab, onTabChange, isPersonal }: NavigationProps) {
  const navigationItems = isPersonal
    ? [personalItem, ...userNavigationItems.slice(1)]
    : userNavigationItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur-xl border-t border-border/50 z-[100] shadow-lg pb-safe safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2.5 px-3 rounded-xl transition-all duration-200",
                "active:scale-95 touch-manipulation",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn("text-[11px] font-medium", isActive && "font-bold")}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
