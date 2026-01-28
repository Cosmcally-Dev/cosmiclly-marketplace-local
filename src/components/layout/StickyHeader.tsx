import { StickyPromoBar } from '@/components/home/StickyPromoBar';
import { Header } from './Header';

export const StickyHeader = () => {
  return (
    <div className="sticky top-0 z-50 w-full">
      <StickyPromoBar />
      <Header />
    </div>
  );
};
