"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessagesSquare, Target, Zap, LineChart, Plug, Settings, Hexagon } from "lucide-react";

const main = [
  { href: "/", label: "Home", icon: Home },
  { href: "/conversations", label: "Conversations", icon: MessagesSquare },
  { href: "/opportunities", label: "Opportunities", icon: Target },
  { href: "/actions", label: "Actions", icon: Zap },
  { href: "/insights", label: "Insights", icon: LineChart },
];
const workspace = [
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  const Item = ({ href, label, icon: Icon }: (typeof main)[number]) => {
    const active = path === href;
    return (
      <Link href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition
          ${active ? "text-pri bg-card2" : "text-sec hover:text-pri hover:bg-card2"}`}>
        <Icon className="w-4 h-4" /> {label}
      </Link>
    );
  };
  return (
    <aside className="w-[224px] shrink-0 bg-sidebar border-r border-line flex flex-col px-3 py-5 sticky top-0 h-screen">
      <div className="flex items-center gap-2 px-2 mb-7">
        <div className="w-7 h-7 rounded-lg bg-teal/15 grid place-items-center text-teal"><Hexagon className="w-4 h-4" /></div>
        <span className="text-[13px] font-medium tracking-tight">DareXAI</span>
      </div>
      <nav className="flex flex-col gap-0.5">{main.map((i) => <Item key={i.href} {...i} />)}</nav>
      <div className="px-3 mt-6 mb-2 text-[10px] tracking-[0.12em] text-mut font-medium">WORKSPACE</div>
      <nav className="flex flex-col gap-0.5">{workspace.map((i) => <Item key={i.href} {...i} />)}</nav>
      <div className="mt-auto px-2 pt-4 flex items-center gap-2 text-[11px] text-mut">
        <kbd className="kpi px-1.5 py-0.5 rounded bg-card2 border border-line text-[10px]">⌘K</kbd> Press anywhere
      </div>
    </aside>
  );
}
