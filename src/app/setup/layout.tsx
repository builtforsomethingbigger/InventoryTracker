import { getSetupStatus } from "@/lib/user";
import { redirect } from "next/navigation";

export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, setupComplete } = await getSetupStatus();
  if (!session) redirect("/login");
  if (setupComplete) redirect("/");

  return children;
}
