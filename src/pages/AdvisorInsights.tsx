import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Users, Clock, TrendingUp, BarChart2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";

const REVIEW_COUNT = 5;

const AdvisorInsights = () => {
  const navigate = useNavigate();

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
            <div className="w-9 h-9 rounded-xl bg-[rgba(162,60,222,0.15)] flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-[#A23CDE]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Insights</h1>
              <p className="text-xs text-muted-foreground">Your performance metrics</p>
            </div>
          </div>

          {/* 2×2 metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Card 1: Average Rating */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(162,60,222,0.15)] flex items-center justify-center">
                    <Star className="w-4 h-4 text-[#A23CDE]" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Average Rating</span>
                </div>
                <p className="text-3xl font-bold text-foreground">4.8</p>
                <div className="flex gap-0.5 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#A23CDE] text-[#A23CDE]" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on {REVIEW_COUNT} reviews
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Return Clients */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Return Clients</span>
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Returning</p>
                    <p className="text-2xl font-bold text-foreground">68%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">New</p>
                    <p className="text-2xl font-bold text-primary">32%</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-border/50 overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: "68%" }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">68 of 100 clients returned</p>
              </CardContent>
            </Card>

            {/* Card 3: Avg Session Duration */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(104,66,239,0.15)] flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#6842EF]" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Avg Duration</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full border-4 border-[rgba(104,66,239,0.3)] flex items-center justify-center shadow-[0_0_14px_hsl(var(--primary)/0.25)] flex-shrink-0">
                    <Clock className="w-6 h-6 text-[#6842EF]" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">32</p>
                    <p className="text-xs text-muted-foreground">minutes / session</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">+4 min vs platform average</p>
              </CardContent>
            </Card>

            {/* Card 4: Accuracy Score */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Accuracy Score</span>
                </div>
                <p className="text-3xl font-bold text-foreground">87%</p>
                <div className="flex items-center justify-between mt-3 mb-1">
                  <span className="text-xs text-muted-foreground">Your score</span>
                  <span className="text-xs text-muted-foreground">Platform avg</span>
                </div>
                <div className="relative h-2 rounded-full bg-border/50 overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: "87%" }} />
                  <div
                    className="absolute top-0 h-full w-0.5 bg-muted-foreground/60"
                    style={{ left: "74%" }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-primary font-medium">87%</span>
                  <span className="text-xs text-muted-foreground">74%</span>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
};

export default AdvisorInsights;
