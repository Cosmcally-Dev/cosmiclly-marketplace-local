import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, MapPin, Calendar, ImageIcon } from "lucide-react";
import { format } from "date-fns";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, credits } = useAuth();

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.username) return user.username[0].toUpperCase();
    return "?";
  };

  const formattedDob = user?.dateOfBirth
    ? format(new Date(user.dateOfBirth), "MMMM d, yyyy")
    : "Not set";

  const passions = ["Astrology", "Tarot", "Meditation", "Yoga", "Spirituality", "Crystal Healing"];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-6xl mx-auto pt-24 pb-12 px-4 text-center">
          <p className="text-muted-foreground text-lg">Please log in to view your profile.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl mx-auto pt-24 pb-12 px-4 flex flex-col md:flex-row gap-8">
        {/* Left Sidebar - Sticky */}
        <aside className="w-full md:w-1/3 lg:w-1/4 md:sticky md:top-24 h-fit space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
            <Avatar className="w-28 h-28 mx-auto ring-4 ring-primary/30">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-foreground font-heading">
                {user?.firstName} {user?.lastName}
              </h1>
              {user?.username && (
                <p className="text-muted-foreground text-sm">@{user.username}</p>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Balance: <span className="text-primary font-semibold">{credits} credits</span>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/settings")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              variant="default"
              className="w-full"
              onClick={() => navigate("/add-credit")}
            >
              Refill Credits
            </Button>
          </div>
        </aside>

        {/* Right Content */}
        <section className="w-full md:w-2/3 lg:w-3/4 space-y-8">
          {/* Bio */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground font-heading mb-3">About Me</h2>
            <p className="text-muted-foreground leading-relaxed">
              Spiritual seeker and tech enthusiast. I love connecting with advisors to gain clarity on my path.
            </p>
          </div>

          {/* Vitals */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground font-heading mb-4">Vitals</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Date of Birth", value: formattedDob, icon: Calendar },
                { label: "Location", value: "New York, USA", icon: MapPin },
                { label: "Gender", value: "Not specified" },
                { label: "Time of Birth", value: user?.timeOfBirth || "Not set" },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground font-heading mb-4">Photos</h2>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-secondary/30 border border-border flex items-center justify-center"
                >
                  <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                </div>
              ))}
            </div>
          </div>

          {/* Passions */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground font-heading mb-4">Passions</h2>
            <div className="flex flex-wrap gap-2">
              {passions.map((passion) => (
                <Badge key={passion} variant="secondary" className="text-sm px-3 py-1">
                  {passion}
                </Badge>
              ))}
            </div>
          </div>

          {/* Prompts */}
          <div className="bg-secondary/20 border border-border rounded-2xl p-6 space-y-2">
            <h3 className="font-bold text-foreground">A non-negotiable for me is...</h3>
            <p className="text-muted-foreground">
              Authenticity. I value honest and genuine connections above everything else.
            </p>
          </div>

          <div className="bg-secondary/20 border border-border rounded-2xl p-6 space-y-2">
            <h3 className="font-bold text-foreground">I'm looking for guidance on...</h3>
            <p className="text-muted-foreground">
              Career transitions and finding my true purpose in life.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
