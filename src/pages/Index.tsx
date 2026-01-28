import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StickyPromoBar } from '@/components/home/StickyPromoBar';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedAdvisorsSection } from '@/components/home/FeaturedAdvisorsSection';
import { RecentlyViewedSection } from '@/components/home/RecentlyViewedSection';
import { AllAdvisorsSection } from '@/components/home/AllAdvisorsSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CookieConsent } from '@/components/CookieConsent';
import { ThemePreview } from '@/components/ThemePreview';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <StickyPromoBar />
      <Header />
      <main>
        <HeroSection />
        <FeaturedAdvisorsSection />
        <RecentlyViewedSection />
        <AllAdvisorsSection />
        <HowItWorksSection />
        <TestimonialsSection />
      </main>
      <Footer />
      <CookieConsent />
      <ThemePreview />
    </div>
  );
};

export default Index;
