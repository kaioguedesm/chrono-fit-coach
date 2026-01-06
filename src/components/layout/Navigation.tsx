import { useRef, useEffect } from "react";
import { Home, User, Dumbbell, Calendar, Apple, BarChart3, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isPersonal?: boolean;
}

const baseNavigationItems = [
  { id: "dashboard", label: "Início", icon: Home },
  { id: "profile", label: "Perfil", icon: User },
  { id: "workout", label: "Treino", icon: Dumbbell },
  { id: "schedule", label: "Agenda", icon: Calendar },
  { id: "nutrition", label: "Nutrição", icon: Apple },
  { id: "progress", label: "Progresso", icon: BarChart3 },
  { id: "settings", label: "Config", icon: Settings },
];

const personalItem = { id: "personal", label: "Personal", icon: Shield };

export function Navigation({ activeTab, onTabChange, isPersonal }: NavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Personal trainers não veem a aba de início (dashboard)
  const navigationItems = isPersonal
    ? [personalItem, ...baseNavigationItems.slice(1)] // Remove dashboard (índice 0)
    : baseNavigationItems;

  // Scroll automático quando o activeTab muda
  useEffect(() => {
    if (activeTab && buttonRefs.current[activeTab] && scrollContainerRef.current) {
      const button = buttonRefs.current[activeTab];
      const container = scrollContainerRef.current;

      // Aguardar um pouco para garantir que o DOM está atualizado
      setTimeout(() => {
        const buttonRect = button.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const buttonLeft = buttonRect.left - containerRect.left + container.scrollLeft;
        const buttonWidth = buttonRect.width;
        const containerWidth = containerRect.width;
        const scrollLeft = container.scrollLeft;

        // Calcular a posição para centralizar o botão
        const targetScroll = buttonLeft - containerWidth / 2 + buttonWidth / 2;

        container.scrollTo({
          left: targetScroll,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [activeTab]);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);

    // Scroll adicional no clique para garantir que funcione
    if (buttonRefs.current[tabId] && scrollContainerRef.current) {
      const button = buttonRefs.current[tabId];
      const container = scrollContainerRef.current;

      setTimeout(() => {
        button.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }, 50);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur-xl border-t border-border/50 z-[100] shadow-lg pb-safe safe-area-bottom">
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="flex items-center gap-1 px-2 py-2 min-w-max">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Button
                key={item.id}
                ref={(el) => {
                  buttonRefs.current[item.id] = el;
                }}
                variant="ghost"
                onClick={() => handleTabClick(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 h-auto py-3 px-4 min-w-[70px] rounded-xl transition-all duration-200 flex-shrink-0",
                  "active:scale-95 touch-manipulation will-change-transform",
                  isActive
                    ? "text-primary bg-primary/10 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
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
