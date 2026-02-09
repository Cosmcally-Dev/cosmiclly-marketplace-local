import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  CreditCard,
  Bell,
  Shield,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  Star,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SessionHistory } from "@/components/settings/SessionHistory";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Settings = () => {
  const navigate = useNavigate();
  const { user, savedCards, credits, deleteCard, setDefaultCard } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"profile" | "payment" | "history" | "notifications" | "security">(
    "profile",
  );
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Profile form state
  const getFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.firstName || "";
  };

  const [profileData, setProfileData] = useState({
    name: getFullName(),
    email: user?.email || "",
    phone: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: getFullName(),
        email: user.email || "",
        phone: "", // Add phone to your User interface in useAuth if you want to save this
        dateOfBirth: user.dateOfBirth || "",
      });
    }
  }, [user]);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailPromotions: true,
    emailAdvisorUpdates: true,
    pushNotifications: false,
    smsAlerts: false,
  });

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "payment" as const, label: "Payment Methods", icon: CreditCard },
    { id: "history" as const, label: "Session History", icon: History },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
  ];

  const handleSaveProfile = () => {
    setIsEditProfileOpen(false);
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved.",
    });
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

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and settings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <nav className="space-y-1 bg-card rounded-xl border border-border p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Credit Balance Card */}
              <div className="mt-4 p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
                <p className="text-2xl font-bold text-primary">${credits}</p>
                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate("/add-credit")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Credits
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              <div className="bg-card rounded-xl border border-border p-6">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
                      <Button variant="outline" size="sm" onClick={() => setIsEditProfileOpen(true)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-muted-foreground text-sm">Full Name</Label>
                        <p className="text-foreground font-medium mt-1">{getFullName() || "Not set"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Email Address</Label>
                        <p className="text-foreground font-medium mt-1">{user?.email || "Not set"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Phone Number</Label>
                        <p className="text-foreground font-medium mt-1">Not set</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Date of Birth</Label>
                        <p className="text-foreground font-medium mt-1">Not set</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium text-foreground mb-4">Zodiac Sign</h3>
                      <p className="text-muted-foreground text-sm">
                        Add your date of birth to see your zodiac sign and get personalized horoscopes.
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Methods Tab */}
                {activeTab === "payment" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-foreground">Payment Methods</h2>
                      <Button variant="outline" size="sm" onClick={() => navigate("/add-credit")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add New
                      </Button>
                    </div>

                    <Separator />

                    {savedCards.length > 0 ? (
                      <div className="space-y-4">
                        {savedCards.map((card) => (
                          <div
                            key={card.id}
                            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                              card.isDefault ? "bg-primary/5 border-primary" : "bg-muted/50 border-border"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground">•••• •••• •••• {card.lastFourDigits}</p>
                                  {card.isDefault && (
                                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {card.cardholderName} · Expires {card.expirationDate}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!card.isDefault && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-primary"
                                  onClick={() => {
                                    setDefaultCard(card.id);
                                    toast({
                                      title: "Default card updated",
                                      description: `Card ending in ${card.lastFourDigits} is now your default payment method.`,
                                    });
                                  }}
                                >
                                  <Star className="w-4 h-4 mr-1" />
                                  Set Default
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  deleteCard(card.id);
                                  toast({
                                    title: "Card removed",
                                    description: `Card ending in ${card.lastFourDigits} has been removed.`,
                                  });
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-medium text-foreground mb-2">No payment methods</h3>
                        <p className="text-sm text-muted-foreground mb-4">Add a payment method to purchase credits</p>
                        <Button onClick={() => navigate("/add-credit")}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Payment Method
                        </Button>
                      </div>
                    )}

                    <Separator />

                    <div>
                      <h3 className="font-medium text-foreground mb-4">Transaction History</h3>
                      <p className="text-muted-foreground text-sm">
                        View your recent transactions and purchase history.
                      </p>
                      <Button variant="link" className="px-0 mt-2">
                        View Transaction History
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Session History Tab */}
                {activeTab === "history" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground">Session History</h2>
                    <Separator />
                    <SessionHistory />
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground">Notification Preferences</h2>

                    <Separator />

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Promotional Emails</p>
                          <p className="text-sm text-muted-foreground">
                            Receive emails about special offers and discounts
                          </p>
                        </div>
                        <Switch
                          checked={notifications.emailPromotions}
                          onCheckedChange={(checked) =>
                            setNotifications((prev) => ({ ...prev, emailPromotions: checked }))
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Advisor Updates</p>
                          <p className="text-sm text-muted-foreground">
                            Get notified when your favorite advisors are online
                          </p>
                        </div>
                        <Switch
                          checked={notifications.emailAdvisorUpdates}
                          onCheckedChange={(checked) =>
                            setNotifications((prev) => ({ ...prev, emailAdvisorUpdates: checked }))
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Push Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                        </div>
                        <Switch
                          checked={notifications.pushNotifications}
                          onCheckedChange={(checked) =>
                            setNotifications((prev) => ({ ...prev, pushNotifications: checked }))
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">SMS Alerts</p>
                          <p className="text-sm text-muted-foreground">Get text messages for important updates</p>
                        </div>
                        <Switch
                          checked={notifications.smsAlerts}
                          onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, smsAlerts: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-foreground">Security Settings</h2>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">Password</p>
                          <p className="text-sm text-muted-foreground">Last changed: Never</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Change Password
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">Two-Factor Authentication</p>
                          <p className="text-sm text-muted-foreground">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Enable
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">Active Sessions</p>
                          <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View Sessions
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="pt-4">
                      <h3 className="font-medium text-foreground mb-4">Danger Zone</h3>
                      <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                        Delete Account
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Edit Profile Modal */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={profileData.phone}
                onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) => setProfileData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditProfileOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSaveProfile}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
