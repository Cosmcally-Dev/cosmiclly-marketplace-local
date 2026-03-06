import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StickyHeader } from '@/components/layout/StickyHeader';
import { Footer } from '@/components/layout/Footer';
import { FileText } from 'lucide-react';

interface LegalPageProps {
  title: string;
  lastUpdated?: string;
  markdownContent: string;
}

/** Strip the first `# Heading` line since the hero section renders the title. */
function stripFirstHeading(md: string): string {
  return md.replace(/^#\s+.+\n+/, '');
}

export default function LegalPage({ title, lastUpdated, markdownContent }: LegalPageProps) {
  const content = stripFirstHeading(markdownContent);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StickyHeader />
      <main className="flex-1 pt-20 md:pt-24">
        {/* Hero */}
        <section className="text-center py-16 md:py-20 px-4 bg-gradient-to-b from-primary/5 to-transparent">
          <FileText className="w-14 h-14 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">
            {title}
          </h1>
          {lastUpdated && (
            <p className="text-muted-foreground text-sm">Last Updated: {lastUpdated}</p>
          )}
        </section>

        {/* Markdown Content */}
        <div className="container mx-auto px-4 pb-16 max-w-4xl">
          <article className="prose prose-invert max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-td:text-muted-foreground prose-th:text-foreground prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-hr:border-border mt-10">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
