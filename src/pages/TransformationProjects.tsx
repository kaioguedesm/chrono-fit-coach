import { useState } from "react";
import { useTransformationProject } from "@/hooks/useTransformationProject";
import { ProjectSelection } from "@/components/transformation/ProjectSelection";
import { ProjectTracking } from "@/components/transformation/ProjectTracking";
import { ProjectCompletion } from "@/components/transformation/ProjectCompletion";
import { Loader2 } from "lucide-react";
import { usePaywall } from "@/hooks/usePaywall";
import { PaywallModal } from "@/components/subscription/PaywallModal";
import { PremiumLockOverlay } from "@/components/subscription/PremiumLockOverlay";

export default function TransformationProjects() {
  const { isPremium, paywallOpen, setPaywallOpen } = usePaywall();
  const {
    activeProject,
    checkins,
    loading,
    checkingIn,
    completedDays,
    totalDays,
    progressPercent,
    remainingDays,
    startProject,
    checkIn,
    abandonProject,
    refetch,
  } = useTransformationProject();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSelectProject = (days: number) => {
    if (!isPremium) {
      setPaywallOpen(true);
      return;
    }
    startProject(days);
  };

  // Completed project view
  if (activeProject?.status === 'completed') {
    return (
      <ProjectCompletion
        project={activeProject}
        completedDays={completedDays}
        onStartNew={(days: number) => startProject(days)}
      />
    );
  }

  // Active project tracking
  if (activeProject && activeProject.status === 'active') {
    return (
      <ProjectTracking
        project={activeProject}
        checkins={checkins}
        completedDays={completedDays}
        totalDays={totalDays}
        progressPercent={progressPercent}
        remainingDays={remainingDays}
        checkingIn={checkingIn}
        onCheckIn={checkIn}
        onAbandon={abandonProject}
      />
    );
  }

  // No active project - show selection
  return <ProjectSelection onSelectProject={startProject} />;
}
