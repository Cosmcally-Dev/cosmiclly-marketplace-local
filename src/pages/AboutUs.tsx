import LegalPage from '@/components/layout/LegalPage';
import content from '../../docs/ABOUT_US.md?raw';

export default function AboutUs() {
  return <LegalPage title="About Cosmiclly" markdownContent={content} />;
}
