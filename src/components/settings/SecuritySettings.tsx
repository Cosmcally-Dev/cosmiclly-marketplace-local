import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const SecuritySettings = () => {
  const securityItems = [
    { title: 'Password', desc: 'Last changed: Never', action: 'Change Password' },
    { title: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account', action: 'Enable' },
    { title: 'Active Sessions', desc: 'Manage your active login sessions', action: 'View Sessions' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Security Settings</h2>
      <Separator />

      <div className="space-y-4">
        {securityItems.map((item) => (
          <div key={item.title} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <Button variant="outline" size="sm">{item.action}</Button>
          </div>
        ))}
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
  );
};

export default SecuritySettings;
