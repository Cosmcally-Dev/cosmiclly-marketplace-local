import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, MessageSquare, Phone, Search, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const mockClients = [
  { id: "1", username: "Yasmin26",        avatar: "https://i.pravatar.cc/150?img=47", paid: 0,    sessions: 78   },
  { id: "2", username: "JazzedDan",       avatar: "https://i.pravatar.cc/150?img=32", paid: 1230, sessions: 2282 },
  { id: "3", username: "StarrySurfer",    avatar: "https://i.pravatar.cc/150?img=25", paid: 1230, sessions: 78   },
  { id: "4", username: "Slipperz87",      avatar: "https://i.pravatar.cc/150?img=44", paid: 1230, sessions: 78   },
  { id: "5", username: "CoolCollector26", avatar: "https://i.pravatar.cc/150?img=16", paid: 0,    sessions: 33   },
  { id: "6", username: "MysticRose99",    avatar: "https://i.pravatar.cc/150?img=20", paid: 540,  sessions: 141  },
  { id: "7", username: "SpiritWalker",    avatar: "https://i.pravatar.cc/150?img=12", paid: 240,  sessions: 56   },
];

const AdvisorClients = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientSearch, setClientSearch] = useState("");
  const [isOnline, setIsOnline] = useState(false);

  const handleStatusToggle = async (checked: boolean) => {
    setIsOnline(checked);
    if (!user?.id) return;
    const { error } = await supabase
      .from("advisor_details")
      .update({ status: checked ? "online" : "offline" })
      .eq("id", user.id);
    if (error) {
      console.error("[AdvisorClients] Status update error:", error);
      setIsOnline(!checked);
    }
  };

  const filtered = mockClients.filter((c) =>
    c.username.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8 max-w-2xl">

          {/* Back button */}
          <button
            onClick={() => navigate("/advisor-portal")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          {/* Page title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">My Clients</h1>
              <p className="text-xs text-muted-foreground">{mockClients.length} total clients</p>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">

            {/* Availability row */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border/50">
              <span className="text-sm font-medium text-foreground">I'm available</span>
              <Switch checked={isOnline} onCheckedChange={handleStatusToggle} />
            </div>

            {/* Chat / Voice quick buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl bg-card border border-border/50 hover:border-emerald-500/40 transition-colors group">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-xs font-semibold text-foreground tracking-wide">Chat</span>
              </button>
              <button className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl bg-card border border-border/50 hover:border-primary/40 transition-colors group">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground tracking-wide">Voice</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Session History label */}
            <p className="text-[11px] font-bold text-primary uppercase tracking-widest pt-1">
              Session History
            </p>

            {/* Client rows */}
            <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No clients found</p>
              ) : (
                filtered.map((client, idx) => (
                  <div
                    key={client.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/10 active:bg-secondary/20 transition-colors ${
                      idx < filtered.length - 1 ? "border-b border-border/30" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <Avatar className="w-11 h-11 flex-shrink-0 ring-1 ring-border/40">
                      <AvatarImage src={client.avatar} alt={client.username} className="object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                        {client.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name + badges */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug truncate">
                        {client.username}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                            client.paid > 0
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-secondary/40 text-muted-foreground border-border/40"
                          }`}
                        >
                          ${client.paid} paid
                        </span>
                        {client.sessions > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full font-medium">
                            <MessageSquare className="w-2.5 h-2.5" />
                            {client.sessions}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Count + chevron */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                        {client.sessions}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default AdvisorClients;
