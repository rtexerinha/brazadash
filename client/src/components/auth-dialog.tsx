import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/language-context";
import { ShoppingBag, Store, Briefcase, ArrowLeft, Shield, ArrowRight } from "lucide-react";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_OPTIONS = [
  {
    key: "customer",
    icon: ShoppingBag,
    titleKey: "authDialog.role.customer",
    descKey: "authDialog.role.customerDesc",
  },
  {
    key: "vendor",
    icon: Store,
    titleKey: "authDialog.role.vendor",
    descKey: "authDialog.role.vendorDesc",
  },
  {
    key: "service_provider",
    icon: Briefcase,
    titleKey: "authDialog.role.provider",
    descKey: "authDialog.role.providerDesc",
  },
] as const;

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      localStorage.setItem("brazadash-pending-role", selectedRole);
    }
    window.location.href = "/api/login";
  };

  const handleBack = () => {
    setSelectedRole(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedRole(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
            {t("authDialog.rolePrompt")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          {ROLE_OPTIONS.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.key;
            return (
              <Card
                key={role.key}
                className={`cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : "hover-elevate"}`}
                onClick={() => setSelectedRole(role.key)}
                data-testid={`card-role-${role.key}`}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium" data-testid={`text-role-title-${role.key}`}>{t(role.titleKey)}</p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-role-desc-${role.key}`}>{t(role.descKey)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            size="lg"
            className="w-full text-base gap-2"
            onClick={handleContinue}
            disabled={!selectedRole}
            data-testid="button-auth-continue"
          >
            {t("authDialog.continue")}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
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
