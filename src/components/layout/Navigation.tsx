import { useRef, useEffect, useState } from "react";
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
  const [isScrolling, setIsScrolling] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const hoverDisabledRef = useRef(false);

  // Personal trainers não veem a aba de início (dashboard)
  const navigationItems = isPersonal
    ? [personalItem, ...baseNavigationItems.slice(1)] // Remove dashboard (índice 0)
    : baseNavigationItems;

  // Scroll automático quando o activeTab muda
  useEffect(() => {
    if (activeTab && buttonRefs.current[activeTab] && scrollContainerRef.current) {
      const button = buttonRefs.current[activeTab];
      const container = scrollContainerRef.current;

      setIsScrolling(true);
      hoverDisabledRef.current = true;
      setHoveredItem(null); // Limpar hover durante scroll

      // Aguardar um pouco para garantir que o DOM está atualizado
      setTimeout(() => {
        const buttonRect = button.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const buttonLeft = buttonRect.left - containerRect.left + container.scrollLeft;
        const buttonWidth = buttonRect.width;
        const containerWidth = containerRect.width;

        // Calcular a posição para centralizar o botão
        const targetScroll = buttonLeft - containerWidth / 2 + buttonWidth / 2;

        container.scrollTo({
          left: targetScroll,
          behavior: "smooth",
        });

        // Aguardar o scroll terminar e manter hover desabilitado por mais tempo
        setTimeout(() => {
          setIsScrolling(false);
          setTimeout(() => {
            hoverDisabledRef.current = false;
          }, 300); // Manter desabilitado por mais 300ms após scroll
        }, 600);
      }, 100);
    }
  }, [activeTab]);

  const handleTabClick = (tabId: string) => {
    // Desabilitar hover imediatamente e por um tempo
    hoverDisabledRef.current = true;
    setHoveredItem(null);
    onTabChange(tabId);

    // Scroll adicional no clique para garantir que funcione
    if (buttonRefs.current[tabId] && scrollContainerRef.current) {
      const button = buttonRefs.current[tabId];
      const container = scrollContainerRef.current;

      setIsScrolling(true);

      setTimeout(() => {
        button.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });

        // Aguardar o scroll terminar e manter hover desabilitado
        setTimeout(() => {
          setIsScrolling(false);
          setTimeout(() => {
            hoverDisabledRef.current = false;
          }, 400); // Manter desabilitado por mais 400ms após scroll
        }, 600);
      }, 50);
    } else {
      // Se não houver scroll, ainda desabilitar hover por um tempo
      setTimeout(() => {
        hoverDisabledRef.current = false;
      }, 500);
    }
  };

  const handleMouseEnter = (itemId: string) => {
    // Só permitir hover se não estiver em scroll, hover não estiver desabilitado, e o item não estiver ativo
    if (!isScrolling && !hoverDisabledRef.current && activeTab !== itemId) {
      setHoveredItem(itemId);
    }
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
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

            // Só mostrar hover se não estiver ativo, não estiver em scroll, e hover não estiver desabilitado
            const isHovered = hoveredItem === item.id && !isActive && !isScrolling && !hoverDisabledRef.current;

            return (
              <Button
                key={item.id}
                ref={(el) => {
                  buttonRefs.current[item.id] = el;
                }}
                variant="ghost"
                onClick={() => handleTabClick(item.id)}
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
                onTouchStart={() => {
                  // Desabilitar hover imediatamente em touch
                  hoverDisabledRef.current = true;
                  setHoveredItem(null);
                }}
                onTouchEnd={() => {
                  // Limpar hover em dispositivos touch e manter desabilitado por um tempo
                  setHoveredItem(null);
                  setTimeout(() => {
                    hoverDisabledRef.current = false;
                  }, 300);
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 h-auto py-3 px-4 min-w-[70px] rounded-xl transition-all duration-200 flex-shrink-0",
                  "active:scale-95 touch-manipulation will-change-transform",
                  isActive
                    ? "text-primary bg-primary/10 shadow-sm"
                    : isHovered
                      ? "text-foreground bg-accent/50"
                      : "text-muted-foreground",
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
