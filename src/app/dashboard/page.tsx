import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import DashboardNavbar from "@/components/DashboardNavbar";
import ReporterView, { TicketItem } from "@/components/ReporterView";
import ITStaffUnifiedView from "@/components/ITStaffUnifiedView";
import SuperadminView, {
  SuperadminUserItem,
  AuditLogItem,
} from "@/components/SuperadminView";
import ManagementView, {
  ManagementTicketItem,
} from "@/components/ManagementView";

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors">
        <DashboardNavbar
          user={{
            userId: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            departmentUnitName: user.departmentUnit?.name,
          }}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7">
          <ReporterView tickets={tickets} userName={user.fullName} unitName={user.departmentUnit?.name || "Unit RS"} />
        </main>
      </div>
    );
  }

  // 2. Jika Role adalah SUPERADMIN (Pusat Kendali Administrasi & Keamanan Sistem)
  if (user.role === Role.SUPERADMIN) {
    const [rawUsers, rawUnits, rawCategories, rawAuditLogs, rawTickets, technicians] =
      await Promise.all([
        prisma.user.findMany({
          include: { departmentUnit: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.departmentUnit.findMany({
          include: {
            _count: { select: { users: true, tickets: true } },
          },
          orderBy: { name: "asc" },
        }),
        prisma.category.findMany({
          include: {
            _count: { select: { tickets: true } },
          },
          orderBy: { id: "asc" },
        }),
        prisma.systemAuditLog.findMany({
          take: 100,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { fullName: true, username: true, role: true },
            },
          },
        }),
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
          where: {
            role: { in: [Role.IT_STAFF, Role.SUPERADMIN] },
            isActive: true,
          },
          select: { id: true, fullName: true },
        }),
      ]);

    const usersList: SuperadminUserItem[] = rawUsers.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      nip: u.nip,
      phoneNumber: u.phoneNumber,
      role: u.role,
      isActive: u.isActive,
      departmentUnitId: u.departmentUnitId,
      departmentUnit: {
        id: u.departmentUnit.id,
        name: u.departmentUnit.name,
        buildingZone: u.departmentUnit.buildingZone,
      },
      failedLoginCount: u.failedLoginCount,
      lockedUntil: u.lockedUntil,
      createdAt: u.createdAt,
    }));

    const auditLogsList: AuditLogItem[] = rawAuditLogs.map((log) => ({
      id: log.id.toString(),
      action: log.action,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      payload: log.payload,
      createdAt: log.createdAt,
      user: log.user,
    }));

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors">
        <DashboardNavbar
          user={{
            userId: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            departmentUnitName: user.departmentUnit?.name,
          }}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7">
          <SuperadminView
            users={usersList}
            units={rawUnits}
            categories={rawCategories}
            auditLogs={auditLogsList}
            tickets={tickets}
            technicians={technicians}
            currentUserId={user.id}
            currentUserName={user.fullName}
            currentUserRole={user.role}
          />
        </main>
      </div>
    );
  }

  // 3. Jika Role adalah Karumkit / Direksi / Pimpinan (MANAGEMENT)
  if (user.role === Role.MANAGEMENT) {
    const [rawTickets, rawUnits, rawCategories, rawTechnicians] = await Promise.all([
      prisma.ticket.findMany({
        include: {
          unit: true,
          category: true,
          assignedTechnician: { select: { id: true, fullName: true, username: true } },
          reporter: { select: { id: true, fullName: true, username: true } },
          attachments: true,
          rating: true,
        },
        orderBy: { submittedAt: "desc" },
      }),
      prisma.departmentUnit.findMany({
        include: {
          _count: { select: { tickets: true, users: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        include: {
          _count: { select: { tickets: true } },
        },
        orderBy: { id: "asc" },
      }),
      prisma.user.findMany({
        where: {
          role: { in: [Role.IT_STAFF, Role.SUPERADMIN] },
          isActive: true,
        },
        select: {
          id: true,
          fullName: true,
          username: true,
          role: true,
          departmentUnit: { select: { name: true } },
        },
        orderBy: { fullName: "asc" },
      }),
    ]);

    const tickets: ManagementTicketItem[] = rawTickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      description: t.description,
      urgency: t.urgency,
      status: t.status,
      submittedAt: t.submittedAt,
      firstAssignedAt: t.firstAssignedAt,
      workStartedAt: t.workStartedAt,
      workResolvedAt: t.workResolvedAt,
      responseMinutes: t.responseMinutes,
      repairMinutes: t.repairMinutes,
      totalLeadMinutes: t.totalLeadMinutes,
      unit: {
        id: t.unit.id,
        name: t.unit.name,
        buildingZone: t.unit.buildingZone,
      },
      category: {
        id: t.category.id,
        name: t.category.name,
        targetSlaMinutes: t.category.targetSlaMinutes,
      },
      reporter: {
        id: t.reporter.id,
        fullName: t.reporter.fullName,
        username: t.reporter.username,
      },
      assignedTechnician: t.assignedTechnician,
      rating: t.rating ? { ratingScore: t.rating.ratingScore, feedback: t.rating.feedback } : null,
      attachments: t.attachments.map((a) => ({
        id: a.id,
        fileType: a.fileType,
        storedFilename: a.storedFilename,
        originalName: a.originalName,
      })),
    }));

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors">
        <DashboardNavbar
          user={{
            userId: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            departmentUnitName: user.departmentUnit?.name,
          }}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7">
          <ManagementView
            tickets={tickets}
            units={rawUnits}
            categories={rawCategories}
            technicians={rawTechnicians}
            currentUserName={user.fullName}
          />
        </main>
      </div>
    );
  }

  // 4. Jika Role adalah Tim TI (IT_STAFF)
  // Menampilkan All-In-One Unified Workbench: Meja Antrean Helpdesk + Pengerjaan Mandiri Teknisi
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
      where: {
        role: { in: [Role.IT_STAFF, Role.SUPERADMIN] },
        isActive: true,
      },
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors">
      <DashboardNavbar
        user={{
          userId: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          departmentUnitName: user.departmentUnit?.name,
        }}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7">
        <ITStaffUnifiedView
          tickets={tickets}
          technicians={technicians}
          currentUserId={user.id}
          currentUserName={user.fullName}
          currentUserRole={user.role}
        />
      </main>
    </div>
  );
}

