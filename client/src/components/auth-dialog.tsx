import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { LogIn, UserPlus, Shield } from "lucide-react";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { t } = useLanguage();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-auth">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <span className="text-xl font-bold text-primary-foreground">B</span>
            </div>
          </div>
          <DialogTitle className="text-xl" data-testid="text-auth-dialog-title">
            {t("authDialog.title")}
          </DialogTitle>
          <DialogDescription className="text-base" data-testid="text-auth-dialog-desc">
            {t("authDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            size="lg"
            className="w-full text-base gap-2"
            onClick={handleLogin}
            data-testid="button-auth-login"
          >
            <LogIn className="h-5 w-5" />
            {t("authDialog.login")}
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full text-base gap-2"
            onClick={handleLogin}
            data-testid="button-auth-register"
          >
            <UserPlus className="h-5 w-5" />
            {t("authDialog.register")}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span data-testid="text-auth-secure">{t("authDialog.secure")}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useAuthDialog() {
  const [open, setOpen] = useState(false);
  return {
    open,
    setOpen,
    openAuthDialog: () => setOpen(true),
    authDialogProps: { open, onOpenChange: setOpen },
  };
}
