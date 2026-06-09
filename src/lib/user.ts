import { auth } from "./auth";
import { prisma } from "./db";

export async function getSetupStatus() {
  const session = await auth();
  if (!session?.user?.id) return { session: null, setupComplete: false };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { setupComplete: true },
  });

  return {
    session,
    setupComplete: user?.setupComplete ?? false,
  };
}
