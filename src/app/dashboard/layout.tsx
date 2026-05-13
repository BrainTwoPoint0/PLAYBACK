import { ProvisionPendingHook } from './ProvisionPendingHook';

/**
 * Dashboard layout. Wraps every page under /dashboard so the
 * ProvisionPendingHook fires once per tab session whenever a parent lands
 * here (the most common post-confirmation destination per the existing
 * register-flow redirect to /dashboard).
 *
 * The hook itself renders null and is per-tab idempotent. PLAYHUB's
 * provision-pending endpoint is itself idempotent (B1's three-tier design)
 * so this is layered defence against any failure in the trigger.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProvisionPendingHook />
      {children}
    </>
  );
}
