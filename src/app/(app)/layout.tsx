import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { getSetupStatus } from "@/lib/user";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setupComplete } = await getSetupStatus();
  if (!setupComplete) redirect("/setup");

  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
