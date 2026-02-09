import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const NotificationSettings = () => {
  const [notifications, setNotifications] = useState({
    emailPromotions: true,
    emailAdvisorUpdates: true,
    pushNotifications: false,
    smsAlerts: false,
  });

  const items = [
    { key: 'emailPromotions' as const, title: 'Promotional Emails', desc: 'Receive emails about special offers and discounts' },
    { key: 'emailAdvisorUpdates' as const, title: 'Advisor Updates', desc: 'Get notified when your favorite advisors are online' },
    { key: 'pushNotifications' as const, title: 'Push Notifications', desc: 'Receive push notifications on your device' },
    { key: 'smsAlerts' as const, title: 'SMS Alerts', desc: 'Get text messages for important updates' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Notification Preferences</h2>
      <Separator />
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={item.key}>
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [item.key]: checked }))}
              />
            </div>
            {i < items.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationSettings;
