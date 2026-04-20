import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/layout/Navigation";
import { InstallPWA } from "@/components/common/InstallPWA";
import { Dashboard } from "@/pages/Dashboard";
import Profile from "./Profile";
import Workout from "./Workout";
import Settings from "./Settings";
import Nutrition from "./Nutrition";
import PersonalArea from "./PersonalArea";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { usePaywall } from "@/hooks/usePaywall";
import { PaywallModal } from "@/components/subscription/PaywallModal";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { isPersonal, loading: roleLoading } = useUserRole();
  const { isPremium, loading: paywallLoading, paywallOpen, setPaywallOpen } = usePaywall();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    if (checkoutStatus === "success") {
      toast({ title: "🎉 Assinatura ativada!", description: "Bem-vindo ao NexFit! Aproveite todos os recursos." });
      setSearchParams({}, { replace: true });
    } else if (checkoutStatus === "cancel") {
      toast({ title: "Checkout cancelado", description: "Você pode assinar quando quiser.", variant: "destructive" });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !roleLoading && isPersonal && activeTab === "dashboard") {
      setActiveTab("personal");
    }
  }, [user, isPersonal, roleLoading, activeTab]);

  const renderActiveTab = () => {
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
      case "diet":
        return <Nutrition />;
      case "settings":
        return <Settings />;
      default:
        return isPersonal ? <PersonalArea /> : <Dashboard onNavigateToTab={setActiveTab} />;
    }
  };

  const isLoading = roleLoading || paywallLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24 pt-16 touch-manipulation">
      <div className="h-full animate-fade-in">{renderActiveTab()}</div>
      <InstallPWA />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} isPersonal={isPersonal} />
      <PaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} />
    </div>
  );
};

export default Index;
