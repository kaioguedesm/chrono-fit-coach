import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning" | "info";
}

export const showToast = ({ title, description, variant = "default" }: ToastOptions) => {
  const config = {
    description,
    duration: 4000,
  };

  switch (variant) {
    case "success":
      sonnerToast.success(title, config);
      break;
    case "error":
      sonnerToast.error(title, config);
      break;
    case "warning":
      sonnerToast.warning(title, config);
      break;
    case "info":
      sonnerToast.info(title, config);
      break;
    default:
      sonnerToast(title, config);
  }
};
