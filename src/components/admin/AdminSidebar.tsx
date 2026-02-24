import { LayoutDashboard, UserCheck, Users, Phone, AlertTriangle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type AdminSection = 'dashboard' | 'approvals' | 'users' | 'sessions' | 'disputes';

interface AdminSidebarProps {
  active: AdminSection;
  onNavigate: (section: AdminSection) => void;
  pendingCount?: number;
}

const navItems: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'approvals', label: 'Advisor Approvals', icon: UserCheck },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'sessions', label: 'Sessions', icon: Phone },
  { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
];

export const AdminSidebar = ({ active, onNavigate, pendingCount }: AdminSidebarProps) => {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col min-h-screen shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">Admin Panel</h2>
        <p className="text-xs text-muted-foreground mt-1">Cosmiclly Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
              {item.id === 'approvals' && pendingCount && pendingCount > 0 ? (
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {pendingCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
          <span className="font-medium text-sm">Back to Site</span>
        </button>
      </div>
    </aside>
  );
};
