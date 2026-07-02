export const dynamic = "force-dynamic";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const s = await getSession();
  const tenant = s ? await prisma.tenant.findUnique({ where: { id: s.tid } }) : null;
  const user = s ? await prisma.user.findUnique({ where: { id: s.sub } }) : null;

  return (
    <main className="px-8 py-7 max-w-[600px]">
      <h1 className="text-[30px] font-medium tracking-tight mb-2">Settings</h1>
      <p className="text-sec text-[15px] mb-7">Your business and account details.</p>

      <div className="text-[11px] tracking-[0.1em] text-mut font-medium mb-3">BUSINESS</div>
      <div className="bg-card rounded-xl border border-line p-5 mb-7 flex flex-col gap-3">
        <Row label="Name" value={tenant?.name ?? "—"} />
        <Row label="Industry" value={tenant?.industry ?? "—"} />
        <Row label="Onboarded" value={tenant?.onboarded ? "Yes" : "No"} />
      </div>

      <div className="text-[11px] tracking-[0.1em] text-mut font-medium mb-3">ACCOUNT</div>
      <div className="bg-card rounded-xl border border-line p-5 flex flex-col gap-3">
        <Row label="Name" value={user?.name ?? "—"} />
        <Row label="Email" value={user?.email ?? "—"} />
        <Row label="Role" value={user?.role ?? "—"} />
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-mut">{label}</span>
      <span className="text-[13px] text-pri">{value}</span>
    </div>
  );
}