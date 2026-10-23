import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TicketFormClient from "@/components/TicketFormClient";

export const instant = false;

export default async function LaporPage() {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/");
  }

  // Ambil data user, seluruh master unit ruangan dan kategori masalah
  const [user, units, categories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      include: { departmentUnit: true },
    }),
    prisma.departmentUnit.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      orderBy: { id: "asc" },
    }),
  ]);

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors">
      <main className="max-w-5xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 flex-1">
        <TicketFormClient
          defaultUnitId={user.departmentUnitId}
          units={units}
          categories={categories}
          userName={user.fullName}
        />
      </main>
    </div>
  );
}
