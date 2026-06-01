import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, BookOpen, ListChecks, Timer, RotateCw, Settings, Bookmark } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/study", label: "Study", icon: BookOpen },
  { to: "/practice", label: "Practice", icon: ListChecks },
  { to: "/exam", label: "Exam", icon: Timer },
  { to: "/review", label: "Review", icon: RotateCw }
];

const moreLinks = [
  { to: "/diagnostic", label: "Diagnostic", short: "Diag" },
  { to: "/labs", label: "Labs", short: "Labs" },
  { to: "/resources", label: "Resources", short: "Links" },
  { to: "/favorites", label: "Saved", short: "Saved" }
];

export default function Layout() {
  return (
    <div className="min-h-full pb-20">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-bg/90 px-3 py-3 backdrop-blur sm:px-4">
        <NavLink to="/" className="shrink-0 font-semibold">
          <span className="sm:hidden">CCNA Trainer</span>
          <span className="hidden sm:inline">CCNA 200-301 Trainer</span>
        </NavLink>
        <nav className="flex items-center gap-2 text-xs text-slate-400 sm:gap-3 sm:text-sm">
          {moreLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? "text-accent" : "hover:text-slate-200")}
            >
              <span className="sm:hidden">{l.short}</span>
              <span className="hidden sm:inline">{l.label}</span>
            </NavLink>
          ))}
          <NavLink to="/settings" aria-label="Settings" className="hover:text-slate-200">
            <Settings size={17} />
          </NavLink>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-slate-800 bg-surface py-2"
        aria-label="Main navigation"
      >
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 text-xs touch-manipulation ${isActive ? "text-accent" : "text-slate-400"}`
            }
          >
            <Icon size={20} />
            <span className="truncate text-[10px] sm:text-xs">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
