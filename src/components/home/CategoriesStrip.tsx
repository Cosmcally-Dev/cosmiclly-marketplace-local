import { useNavigate } from 'react-router-dom';
import { categories } from '@/data/categories';

export const CategoriesStrip = () => {
  const navigate = useNavigate();

  // Reorder categories so Love is first
  const orderedCategories = [...categories].sort((a, b) => {
    if (a.slug === 'love') return -1;
    if (b.slug === 'love') return 1;
    return 0;
  });

  return (
    <div className="relative">
      {/* Native Horizontal Scroll Container */}
      <div
        className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {orderedCategories.map((category) => (
          <button
            key={category.slug}
            onClick={() => navigate(`/advisors?category=${category.slug}`)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 hover:bg-primary hover:text-primary-foreground border border-border hover:border-primary transition-all group"
          >
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center`}>
              <category.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground group-hover:text-primary-foreground whitespace-nowrap">
              {category.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
