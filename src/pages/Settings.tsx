import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, CreditCard, History, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import ProfileSettings from '@/components/settings/ProfileSettings';
import PaymentSettings from '@/components/settings/PaymentSettings';
import { SessionHistory } from '@/components/settings/SessionHistory';
import NotificationSettings from '@/components/settings/NotificationSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';

type TabId = 'readings' | 'payment' | 'profile' | 'notifications' | 'security';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout, credits } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const getFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.firstName || user?.username || 'User';
  };

  const getInitials = () => {
    const name = getFullName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const navItems = [
    { id: 'readings' as TabId, label: 'My Readings', icon: History },
    { id: 'payment' as TabId, label: 'Payment Methods', icon: CreditCard },
    { id: 'profile' as TabId, label: 'My Profile', icon: User },
  ];

  const tabTitles: Record<TabId, string> = {
    readings: 'My Readings',
    payment: 'Payment Methods',
    profile: 'My Profile',
    notifications: 'Notifications',
    security: 'Security',
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 items-start">
            {/* Left Sidebar - Sticky */}
            <aside className="sticky top-24 h-fit">
              <Card className="overflow-hidden">
                {/* Profile Header */}
                <div className="p-6 pb-4 flex flex-col items-center text-center border-b border-border">
                  <Avatar className="w-20 h-20 mb-3">
                    <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-lg font-semibold text-foreground">{getFullName()}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Member since 2025</p>
                  <div className="mt-3 px-4 py-2 rounded-lg bg-primary/10 w-full">
                    <p className="text-xs text-muted-foreground">Credit Balance</p>
                    <p className="text-lg font-bold text-primary">${credits}</p>
                  </div>
                </div>

                {/* Navigation */}
                <CardContent className="p-2">
                  <nav className="space-y-1">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-sm transition-colors ${
                          activeTab === item.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    ))}

                    {/* Separator before logout */}
                    <div className="border-t border-border my-2" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </nav>
                </CardContent>
              </Card>
            </aside>

            {/* Right Content Area */}
            <div>
              <Card>
                <CardContent className="p-6">
                  {activeTab === 'readings' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-foreground">My Readings</h2>
                      <SessionHistory />
                    </div>
                  )}
                  {activeTab === 'payment' && <PaymentSettings />}
                  {activeTab === 'profile' && <ProfileSettings />}
                  {activeTab === 'notifications' && <NotificationSettings />}
                  {activeTab === 'security' && <SecuritySettings />}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
