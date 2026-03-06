import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/layout/Navigation";
import { InstallPWA } from "@/components/common/InstallPWA";
import { Dashboard } from "@/pages/Dashboard";
import Profile from "./Profile";
import Workout from "./Workout";
import Schedule from "./Schedule";
import Nutrition from "./Nutrition";
import Progress from "./Progress";
import Settings from "./Settings";
import PersonalArea from "./PersonalArea";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionPaywall } from "@/components/subscription/SubscriptionPaywall";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { isPersonal, loading: roleLoading } = useUserRole();
  const { subscribed, loading: subLoading, checkSubscription } = useSubscription();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Handle checkout redirect
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      toast({ title: '🎉 Assinatura ativada!', description: 'Bem-vindo ao NexFit! Aproveite todos os recursos.' });
      checkSubscription();
      setSearchParams({}, { replace: true });
    } else if (checkoutStatus === 'cancel') {
      toast({ title: 'Checkout cancelado', description: 'Você pode assinar quando quiser.', variant: 'destructive' });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !roleLoading && isPersonal && activeTab === "dashboard") {
      setActiveTab("personal");
    }
  }, [user, isPersonal, roleLoading, activeTab]);

  const renderActiveTab = () => {
    // Personal trainers não têm acesso ao dashboard
    if (isPersonal && activeTab === "dashboard") {
      return <PersonalArea />;
    }

    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigateToTab={setActiveTab} />;
      case "personal":
        return <PersonalArea />;
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
        return isPersonal ? <PersonalArea /> : <Dashboard onNavigateToTab={setActiveTab} />;
    }
  };

  // Personal trainers skip paywall
  const needsPaywall = !isPersonal && !subscribed && !subLoading;

  if (subLoading && !roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24 pt-16 touch-manipulation">
      <div className="h-full animate-fade-in">
        {needsPaywall ? <SubscriptionPaywall /> : renderActiveTab()}
      </div>
      <InstallPWA />
      {!needsPaywall && <Navigation activeTab={activeTab} onTabChange={setActiveTab} isPersonal={isPersonal} />}
    </div>
  );
};

export default Index;
