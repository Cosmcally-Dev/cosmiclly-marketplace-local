import LegalPage from '@/components/layout/LegalPage';
import content from '../../docs/PRIVACY_POLICY.md?raw';

export default function PrivacyPolicy() {
  return <LegalPage title="Privacy Policy" lastUpdated="February 27, 2026" markdownContent={content} />;
}
