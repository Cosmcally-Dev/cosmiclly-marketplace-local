import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

const variantIcons: Record<string, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />,
  destructive: <XCircle className="h-5 w-5 text-destructive shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
  info: <Info className="h-5 w-5 text-primary shrink-0" />,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const icon = variantIcons[props.variant as string];
        return (
          <Toast key={id} {...props}>
            <div className="flex gap-3 items-start">
              {icon}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
