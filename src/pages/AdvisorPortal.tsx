import { useState, useEffect } from 'react';
import { Sparkles, Clock, Mail, XCircle, Phone, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useAdvisorApplication } from '@/hooks/useAdvisorApplication';
import { AdvisorApplicationModal } from '@/components/modals/AdvisorApplicationModal';
import AdvisorPrivateProfile from '@/components/profile/AdvisorPrivateProfile';
import AdvisorSetupWizard from '@/components/advisor/AdvisorSetupWizard';

const AdvisorPortal = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { application, hasAdvisorDetails, isProfileComplete, isLoading: appLoading, refetch } = useAdvisorApplication();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [searchParams] = useSearchParams();

  const isLoading = authLoading || appLoading;

  // Determine portal state
  const getPortalState = () => {
    // Advisor with details but profile not yet completed → show wizard
    if ((hasAdvisorDetails || user?.isAdvisor) && !isProfileComplete) return 'wizard';
    // Fully set-up advisor → show dashboard
    if (hasAdvisorDetails && isProfileComplete) return 'approved';
    if (!application) return 'no-application';
    if (application.status === 'approved') return 'wizard'; // approved but no details yet
    if (application.status === 'rejected') return 'rejected';
    return 'pending'; // 'pending' or any other status
  };

  const portalState = isLoading ? 'loading' : getPortalState();

  // Auto-open application modal when navigating from /become-advisor with ?apply=true
  useEffect(() => {
    if (!isLoading && portalState === 'no-application' && searchParams.get('apply') === 'true') {
      setShowApplyModal(true);
    }
  }, [isLoading, portalState, searchParams]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        {portalState === 'loading' && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {portalState === 'no-application' && (
          <div className="flex flex-col items-center justify-center px-4 py-20">
            <div className="max-w-lg text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                Become an Advisor
              </h1>

              <p className="text-lg text-muted-foreground">
                Share your spiritual gifts with thousands of seekers. Apply today and start earning.
              </p>

              <div className="bg-card border border-border rounded-xl p-6 space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-sm text-foreground/80">
                    Offer chat, voice, and video readings to clients worldwide
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-sm text-foreground/80">
                    Set your own rates and availability schedule
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-sm text-foreground/80">
                    Get reviewed and approved within 24-48 hours
                  </p>
                </div>
              </div>

              <Button variant="hero" size="lg" onClick={() => setShowApplyModal(true)}>
                Apply Now
              </Button>
            </div>
          </div>
        )}

        {portalState === 'pending' && (
          <div className="flex flex-col items-center justify-center px-4 py-20">
            <div className="max-w-lg text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-primary" />
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                Application Under Review
              </h1>

              <p className="text-lg text-muted-foreground">
                Your application is being reviewed. We'll contact you shortly.
              </p>

              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3 text-left">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-sm text-foreground/80">
                    You'll receive an email confirmation with next steps within 24-48 hours.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-sm text-foreground/80">
                    Once approved, you'll gain access to your advisor dashboard to manage readings and connect with clients.
                  </p>
                </div>
              </div>

              {application && (
                <div className="bg-secondary/50 border border-border rounded-xl p-4 text-left text-sm">
                  <p className="text-muted-foreground mb-2 font-medium">Application Details</p>
                  <div className="space-y-1 text-foreground/80">
                    <p><span className="text-muted-foreground">Name:</span> {application.full_name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {application.email}</p>
                    <p><span className="text-muted-foreground">Specialties:</span> {application.specialty}</p>
                    {application.submitted_at && (
                      <p><span className="text-muted-foreground">Submitted:</span> {new Date(application.submitted_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              )}

              <Link to="/">
                <Button variant="outline" className="mt-4">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        )}

        {portalState === 'rejected' && (
          <div className="flex flex-col items-center justify-center px-4 py-20">
            <div className="max-w-lg text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-destructive" />
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                Application Not Approved
              </h1>

              <p className="text-lg text-muted-foreground">
                Unfortunately, your application was not approved at this time.
              </p>

              {application?.notes && (
                <div className="bg-card border border-border rounded-xl p-4 text-left">
                  <p className="text-sm text-muted-foreground mb-1 font-medium">Reviewer Notes</p>
                  <p className="text-sm text-foreground/80">{application.notes}</p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button variant="hero" onClick={() => setShowApplyModal(true)}>
                  Re-Apply
                </Button>
                <Link to="/">
                  <Button variant="outline">Back to Home</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {portalState === 'wizard' && (
          <div className="container mx-auto px-4 py-8">
            <AdvisorSetupWizard onComplete={() => refetch()} />
          </div>
        )}

        {portalState === 'approved' && (
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-heading font-bold text-foreground">Advisor Dashboard</h1>
              <Link to="/advisor-call">
                <Button variant="hero" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Incoming Sessions
                </Button>
              </Link>
            </div>
            <AdvisorPrivateProfile />
          </div>
        )}
      </main>

      <Footer />

      <AdvisorApplicationModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
      />
    </div>
  );
};

export default AdvisorPortal;
