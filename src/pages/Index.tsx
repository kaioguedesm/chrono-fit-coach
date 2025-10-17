import { useState } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { InstallPWA } from "@/components/common/InstallPWA";
import { Dashboard } from "@/pages/Dashboard";
import Profile from "./Profile";
import Workout from "./Workout";
import Schedule from "./Schedule";
import Nutrition from "./Nutrition";
import Progress from "./Progress";
import Settings from "./Settings";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24 pt-14">
      <div className="h-full">
        {renderActiveTab()}
      </div>
      <InstallPWA />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
