import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import DashboardNavbar from "@/components/DashboardNavbar";
import ReporterView, { TicketItem } from "@/components/ReporterView";
import TechnicianView from "@/components/TechnicianView";
import AdminHelpdeskView from "@/components/AdminHelpdeskView";

export const instant = false;

export default async function DashboardPage() {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/");
  }

  // Ambil profil user lengkap beserta nama unit
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { departmentUnit: true },
  });

  if (!user) {
    redirect("/");
  }

  // 1. Jika Role adalah Pelapor Medis / Nakes (STAFF_USER)
  if (user.role === Role.STAFF_USER) {
    const rawTickets = await prisma.ticket.findMany({
      where: {
        OR: [{ reporterId: user.id }, { unitId: user.departmentUnitId }],
      },
      include: {
        unit: true,
        category: true,
        assignedTechnician: { select: { fullName: true } },
        attachments: true,
        rating: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    const tickets: TicketItem[] = rawTickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      description: t.description,
      urgency: t.urgency,
      status: t.status,
      submittedAt: t.submittedAt,
      responseMinutes: t.responseMinutes,
      repairMinutes: t.repairMinutes,
      unit: { name: t.unit.name, buildingZone: t.unit.buildingZone },
      category: { name: t.category.name, targetSlaMinutes: t.category.targetSlaMinutes },
      assignedTechnician: t.assignedTechnician,
      attachments: t.attachments.map((a) => ({
        id: a.id,
        fileType: a.fileType,
        storedFilename: a.storedFilename,
        originalName: a.originalName,
      })),
      rating: t.rating ? { ratingScore: t.rating.ratingScore, feedback: t.rating.feedback } : null,
    }));

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <DashboardNavbar
          user={{
            userId: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            departmentUnitName: user.departmentUnit?.name,
          }}
        />
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
          <ReporterView tickets={tickets} userName={user.fullName} unitName={user.departmentUnit?.name || "Unit RS"} />
        </main>
      </div>
    );
  }

  // 2. Jika Role adalah Teknisi Lapangan (TECHNICIAN)
  if (user.role === Role.TECHNICIAN) {
    const rawTickets = await prisma.ticket.findMany({
      include: {
        unit: true,
        category: true,
        assignedTechnician: { select: { fullName: true } },
        attachments: true,
        rating: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    const tickets: TicketItem[] = rawTickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      description: t.description,
      urgency: t.urgency,
      status: t.status,
      submittedAt: t.submittedAt,
      responseMinutes: t.responseMinutes,
      repairMinutes: t.repairMinutes,
      unit: { name: t.unit.name, buildingZone: t.unit.buildingZone },
      category: { name: t.category.name, targetSlaMinutes: t.category.targetSlaMinutes },
      assignedTechnician: t.assignedTechnician,
      attachments: t.attachments.map((a) => ({
        id: a.id,
        fileType: a.fileType,
        storedFilename: a.storedFilename,
        originalName: a.originalName,
      })),
      rating: t.rating ? { ratingScore: t.rating.ratingScore, feedback: t.rating.feedback } : null,
    }));

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <DashboardNavbar
          user={{
            userId: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            departmentUnitName: user.departmentUnit?.name,
          }}
        />
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
          <TechnicianView tickets={tickets} technicianName={user.fullName} technicianId={user.id} />
        </main>
      </div>
    );
  }

  // 3. Jika Role adalah Helpdesk / Super Admin
  const [rawTickets, technicians] = await Promise.all([
    prisma.ticket.findMany({
      include: {
        unit: true,
        category: true,
        assignedTechnician: { select: { fullName: true } },
        attachments: true,
        rating: true,
      },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: Role.TECHNICIAN, isActive: true },
      select: { id: true, fullName: true },
    }),
  ]);

  const tickets: TicketItem[] = rawTickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    description: t.description,
    urgency: t.urgency,
    status: t.status,
    submittedAt: t.submittedAt,
    responseMinutes: t.responseMinutes,
    repairMinutes: t.repairMinutes,
    unit: { name: t.unit.name, buildingZone: t.unit.buildingZone },
    category: { name: t.category.name, targetSlaMinutes: t.category.targetSlaMinutes },
    assignedTechnician: t.assignedTechnician,
    attachments: t.attachments.map((a) => ({
      id: a.id,
      fileType: a.fileType,
      storedFilename: a.storedFilename,
      originalName: a.originalName,
    })),
    rating: t.rating ? { ratingScore: t.rating.ratingScore, feedback: t.rating.feedback } : null,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DashboardNavbar
        user={{
          userId: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          departmentUnitName: user.departmentUnit?.name,
        }}
      />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
        <AdminHelpdeskView tickets={tickets} technicians={technicians} adminName={user.fullName} />
      </main>
    </div>
  );
}
