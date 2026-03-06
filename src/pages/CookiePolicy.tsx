import LegalPage from '@/components/layout/LegalPage';
import content from '../../docs/COOKIE_POLICY.md?raw';

export default function CookiePolicy() {
  return <LegalPage title="Cookie Policy" lastUpdated="February 27, 2026" markdownContent={content} />;
}
