import { Sparkles, Clock, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdvisorPortal = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-lg text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
          Advisor Portal Coming Soon
        </h1>

        {/* Subtext */}
        <p className="text-lg text-muted-foreground">
          Your application is being reviewed. We will contact you shortly.
        </p>

        {/* Additional info */}
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

        {/* Back to home */}
        <Link to="/">
          <Button variant="outline" className="mt-4">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AdvisorPortal;
