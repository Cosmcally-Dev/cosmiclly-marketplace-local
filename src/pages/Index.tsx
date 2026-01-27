import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FeaturedAdvisorsSection } from '@/components/home/FeaturedAdvisorsSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { PromoBanner } from '@/components/home/PromoBanner';
import { DailyHoroscope } from '@/components/home/DailyHoroscope';
import { CookieConsent } from '@/components/CookieConsent';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturedAdvisorsSection />
        <CategoriesSection />
        <HowItWorksSection />
        <DailyHoroscope />
        <TestimonialsSection />
        <PromoBanner />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
};

export default Index;
