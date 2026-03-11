import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar, type AdminSection } from '@/components/admin/AdminSidebar';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminAdvisorApprovals } from '@/components/admin/AdminAdvisorApprovals';
import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { AdminSessionsTable } from '@/components/admin/AdminSessionsTable';
import { AdminDisputeCenter } from '@/components/admin/AdminDisputeCenter';
import { AdminTransactionsTable } from '@/components/admin/AdminTransactionsTable';
import { AdminReviewsTable } from '@/components/admin/AdminReviewsTable';
import { useAdminStats } from '@/hooks/useAdminStats';

const AdminPanel = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const { stats } = useAdminStats();

  // Guard: redirect non-admins
  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar
        active={activeSection}
        onNavigate={setActiveSection}
        pendingCount={stats?.pending_applications}
      />

      <main className="flex-1 p-6 overflow-auto">
        {activeSection === 'dashboard' && (
          <AdminDashboard onNavigateToApprovals={() => setActiveSection('approvals')} />
        )}
        {activeSection === 'approvals' && <AdminAdvisorApprovals />}
        {activeSection === 'users' && <AdminUsersTable />}
        {activeSection === 'sessions' && <AdminSessionsTable />}
        {activeSection === 'reviews' && <AdminReviewsTable />}
        {activeSection === 'disputes' && <AdminDisputeCenter />}
        {activeSection === 'transactions' && <AdminTransactionsTable />}
      </main>
    </div>
  );
};

export default AdminPanel;
