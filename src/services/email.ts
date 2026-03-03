import { supabase } from '@/integrations/supabase/client';

type EmailType =
  | 'welcome_client'
  | 'welcome_advisor'
  | 'session_receipt'
  | 'low_credit_warning'
  | 'application_approved'
  | 'application_rejected';

interface SendEmailParams {
  toEmail: string;
  toName: string;
  emailType: EmailType;
  templateParams?: Record<string, string | number>;
}

export async function sendEmail({ toEmail, toName, emailType, templateParams }: SendEmailParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to_email: toEmail,
        to_name: toName,
        email_type: emailType,
        template_params: templateParams,
      },
    });

    if (error) {
      console.warn(`[sendEmail] Failed to send ${emailType}:`, error.message);
      return false;
    }

    console.log(`[sendEmail] Sent ${emailType} to ${toEmail}`);
    return true;
  } catch (err) {
    console.warn(`[sendEmail] Exception sending ${emailType}:`, err);
    return false;
  }
}
