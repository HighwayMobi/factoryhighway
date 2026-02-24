import { Home, CheckSquare, Calendar, BookOpen, Settings, User, LogOut } from "lucide-react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Dashboard", to: "/" },
  { icon: CheckSquare, label: "Tasks", to: "/tasks" },
  { icon: Calendar, label: "Calendar", to: "/calendar" },
  { icon: BookOpen, label: "Notes", to: "/notes" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <User className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-sidebar-accent-foreground">Personal Area</h2>
          <p className="text-xs text-sidebar-muted">Your workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <RouterNavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </RouterNavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:text-sidebar-foreground">
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
