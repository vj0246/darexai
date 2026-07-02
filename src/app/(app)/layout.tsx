import Sidebar from "@/components/Sidebar";

// App shell. In production this is a server component that also reads the
// session (getSession) and redirects unauthenticated users — middleware
// already gates, this is defence-in-depth + passes tenant to children.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
