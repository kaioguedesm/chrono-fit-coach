import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/layout/Navigation";
import { Dashboard } from "@/pages/Dashboard";
import Profile from "./Profile";
import Workout from "./Workout";
import Schedule from "./Schedule";
import Nutrition from "./Nutrition";
import Progress from "./Progress";
import Settings from "./Settings";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
        return <Profile />;
      case "workout":
        return <Workout />;
      case "schedule":
        return <Schedule />;
      case "nutrition":
        return <Nutrition />;
      case "progress":
        return <Progress />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard onActionClick={handleActionClick} />;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {renderActiveTab()}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
