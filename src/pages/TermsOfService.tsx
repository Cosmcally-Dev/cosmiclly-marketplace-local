import LegalPage from '@/components/layout/LegalPage';
import content from '../../docs/TERMS_OF_SERVICE.md?raw';

export default function TermsOfService() {
  return <LegalPage title="Terms of Service" lastUpdated="February 27, 2026" markdownContent={content} />;
}
