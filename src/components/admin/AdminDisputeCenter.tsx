import { AlertTriangle } from 'lucide-react';

export const AdminDisputeCenter = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dispute Center</h1>

      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Coming Soon</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          The Dispute Center will be available once Stripe payment integration is complete.
          You'll be able to review session logs, issue refunds, and manage billing disputes.
        </p>
        <div className="mt-8 p-4 bg-muted/50 rounded-lg max-w-sm mx-auto text-left">
          <h4 className="text-sm font-medium text-foreground mb-2">Planned Features:</h4>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
              View session chat logs and call recordings
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
              Issue partial or full refunds via Stripe
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
              Flag sessions for review
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
              Manage billing disputes and chargebacks
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
