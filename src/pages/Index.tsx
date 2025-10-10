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
    // Permite acesso demo (sem autenticação)
    if (!loading && !user && window.location.pathname !== '/') {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleActionClick = (action: string) => {
    // As funcionalidades são gerenciadas pelo Dashboard
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onActionClick={handleActionClick} onNavigateToTab={setActiveTab} />;
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
        return <Dashboard onActionClick={handleActionClick} onNavigateToTab={setActiveTab} />;
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
