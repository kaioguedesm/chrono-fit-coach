import type { WorkoutSession } from "./WorkoutHistory";

interface WorkoutSessionShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: WorkoutSession;
}

export function WorkoutSessionShareDialog({ open, onOpenChange, session }: WorkoutSessionShareDialogProps) {
  return null;
}
