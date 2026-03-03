import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Search } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { AdvisorCard } from '@/components/advisors/AdvisorCard';
import { useAuth } from '@/hooks/useAuth';
import { useAdvisors } from '@/hooks/useAdvisors';
import { useFavorites } from '@/hooks/useFavorites';

const Favorites = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { advisors } = useAdvisors();
  const { favoriteAdvisorIds, isLoading: favsLoading } = useFavorites();

  const isLoading = authLoading || favsLoading;

  const favoriteAdvisors = useMemo(() => {
    return advisors.filter((a) => {
      const advisorDbId = a.dbId || a.id;
      return favoriteAdvisorIds.includes(advisorDbId);
    });
  }, [advisors, favoriteAdvisorIds]);

  if (!authLoading && !isAuthenticated) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              My Favorite Advisors
            </h1>
            <p className="text-muted-foreground">
              Advisors you've saved for quick access
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="text-sm text-muted-foreground mt-4">Loading favorites...</p>
            </div>
          ) : favoriteAdvisors.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="font-heading font-medium text-foreground mb-2">
                No favorites yet
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Browse our advisors and tap the heart icon to save them here for quick access.
              </p>
              <Button asChild>
                <Link to="/advisors">
                  <Search className="w-4 h-4 mr-2" />
                  Browse Advisors
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteAdvisors.map((advisor) => (
                <AdvisorCard key={advisor.id} advisor={advisor} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
