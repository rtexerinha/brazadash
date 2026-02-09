import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/hooks/use-auth";

export default function PendingApprovalPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const { data: roleData } = useQuery<{ roles: string[]; approvalStatus: Record<string, string> }>({
    queryKey: ["/api/user/role"],
    staleTime: 1000 * 30,
    refetchInterval: 30000,
  });

  const roles = roleData?.roles || [];
  const approvalStatus = roleData?.approvalStatus || {};

  const isVendor = roles.includes("vendor");
  const isProvider = roles.includes("service_provider");
  const roleLabel = isVendor
    ? (t("pendingApproval.vendorRole") || "Restaurant / Food Vendor")
    : (t("pendingApproval.providerRole") || "Service Provider");

  const vendorApproved = approvalStatus?.vendor === "approved";
  const providerApproved = approvalStatus?.service_provider === "approved";
  const rejected = (isVendor && approvalStatus?.vendor === "rejected") || (isProvider && approvalStatus?.service_provider === "rejected");

  if ((isVendor && vendorApproved) || (isProvider && providerApproved)) {
    window.location.href = "/";
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>

          {rejected ? (
            <>
              <h1 className="text-2xl font-bold mb-3" data-testid="text-approval-rejected-title">
                {t("pendingApproval.rejectedTitle") || "Registration Not Approved"}
              </h1>
              <p className="text-muted-foreground mb-2" data-testid="text-approval-rejected-desc">
                {t("pendingApproval.rejectedDesc") || "Unfortunately, your registration as a"} <strong>{roleLabel}</strong> {t("pendingApproval.rejectedDescEnd") || "was not approved at this time."}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {t("pendingApproval.rejectedContact") || "Please contact support if you believe this was a mistake."}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-3" data-testid="text-approval-pending-title">
                {t("pendingApproval.title") || "Registration Under Review"}
              </h1>
              <p className="text-muted-foreground mb-2" data-testid="text-approval-pending-desc">
                {t("pendingApproval.desc") || "Your registration as a"} <strong>{roleLabel}</strong> {t("pendingApproval.descEnd") || "is currently being reviewed by our team."}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {t("pendingApproval.wait") || "You will be notified once your account has been approved. This usually takes 1-2 business days."}
              </p>
            </>
          )}

          <div className="p-4 rounded-md bg-muted/50 mb-6">
            <p className="text-sm font-medium mb-1">{t("pendingApproval.statusLabel") || "Status"}</p>
            <p className="text-lg font-semibold" data-testid="text-approval-status">
              {rejected
                ? (t("pendingApproval.statusRejected") || "Rejected")
                : (t("pendingApproval.statusPending") || "Pending Review")
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("pendingApproval.role") || "Role"}: {roleLabel}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => { window.location.href = "/api/logout"; }}
            data-testid="button-logout-pending"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t("pendingApproval.logout") || "Sign Out"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
