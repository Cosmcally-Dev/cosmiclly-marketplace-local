import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const zodiacSigns = [
  { name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19', element: 'Fire' },
  { name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20', element: 'Earth' },
  { name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20', element: 'Air' },
  { name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22', element: 'Water' },
  { name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22', element: 'Fire' },
  { name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22', element: 'Earth' },
  { name: 'Libra', symbol: '♎', dates: 'Sep 23 - Oct 22', element: 'Air' },
  { name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21', element: 'Water' },
  { name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21', element: 'Fire' },
  { name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19', element: 'Earth' },
  { name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18', element: 'Air' },
  { name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20', element: 'Water' },
];

const elementColors = {
  Fire: 'from-orange-500 to-red-600',
  Earth: 'from-emerald-500 to-green-600',
  Air: 'from-sky-500 to-blue-600',
  Water: 'from-blue-500 to-indigo-600',
};

export const DailyHoroscope = () => {
  const [selectedSign, setSelectedSign] = useState<string | null>(null);

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Daily <span className="text-gradient">Horoscope</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select your zodiac sign to discover what the stars have in store for you today
          </p>
        </div>

        {/* Zodiac Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
          {zodiacSigns.map((sign, index) => (
            <button
              key={sign.name}
              onClick={() => setSelectedSign(sign.name)}
              className={`group relative p-4 md:p-6 rounded-xl border transition-all duration-300 hover:-translate-y-1 animate-fade-in ${
                selectedSign === sign.name
                  ? 'bg-primary/20 border-primary'
                  : 'bg-card border-border hover:border-primary/50'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Symbol */}
              <div className={`text-3xl md:text-4xl mb-2 bg-gradient-to-br ${elementColors[sign.element as keyof typeof elementColors]} bg-clip-text text-transparent`}>
                {sign.symbol}
              </div>

              {/* Name */}
              <h3 className="font-medium text-foreground text-sm md:text-base group-hover:text-primary transition-colors">
                {sign.name}
              </h3>

              {/* Dates */}
              <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                {sign.dates}
              </p>

              {/* Arrow */}
              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Selected Sign Preview */}
        {selectedSign && (
          <div className="mt-8 p-6 md:p-8 rounded-xl bg-card border border-border animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="text-5xl">
                {zodiacSigns.find(s => s.name === selectedSign)?.symbol}
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
                  {selectedSign} - Today's Reading
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  The stars align to bring you new opportunities today. A chance encounter may lead to something meaningful. Trust your intuition and remain open to unexpected possibilities. Your natural charisma is especially strong—use it wisely in both personal and professional interactions.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
                >
                  Read full horoscope
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
