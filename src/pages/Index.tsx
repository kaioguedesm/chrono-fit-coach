import { useState } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { Dashboard } from "@/pages/Dashboard";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

  const handleActionClick = (action: string) => {
    switch (action) {
      case "start-workout":
        toast({
          title: "Treino iniciado!",
          description: "Boa sorte com seu treino de hoje 💪",
        });
        break;
      case "add-measurements":
        toast({
          title: "Em breve!",
          description: "Feature de medidas será implementada em breve.",
        });
        break;
      case "take-photo":
        toast({
          title: "Em breve!",
          description: "Feature de fotos será implementada em breve.",
        });
        break;
      case "rest-timer":
        toast({
          title: "Em breve!",
          description: "Timer de descanso será implementado em breve.",
        });
        break;
      default:
        break;
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onActionClick={handleActionClick} />;
      case "profile":
        return <div className="p-4 pb-20">Em breve: Perfil do usuário</div>;
      case "workout":
        return <div className="p-4 pb-20">Em breve: Fichas de treino</div>;
      case "schedule":
        return <div className="p-4 pb-20">Em breve: Agenda de treinos</div>;
      case "nutrition":
        return <div className="p-4 pb-20">Em breve: Plano alimentar</div>;
      case "progress":
        return <div className="p-4 pb-20">Em breve: Monitoramento corporal</div>;
      case "settings":
        return <div className="p-4 pb-20">Em breve: Configurações</div>;
      default:
        return <Dashboard onActionClick={handleActionClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {renderActiveTab()}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
