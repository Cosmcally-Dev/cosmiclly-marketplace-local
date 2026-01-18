import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { zodiacSigns, elementColors } from '@/data/zodiacSigns';

export const DailyHoroscope = () => {
  const [selectedSign, setSelectedSign] = useState<string | null>(null);

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
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
              className={`group relative p-4 md:p-6 rounded-xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/20 animate-fade-in ${
                selectedSign === sign.name
                  ? 'bg-primary/20 border-primary shadow-lg shadow-primary/30'
                  : 'bg-card border-border hover:border-primary/50 hover:bg-card/80'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Zodiac Image */}
              <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-2 rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-110">
                <img 
                  src={sign.image} 
                  alt={sign.name} 
                  className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-110"
                />
              </div>

              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Name */}
              <h3 className="font-medium text-foreground text-sm md:text-base group-hover:text-primary transition-colors relative z-10">
                {sign.name}
              </h3>

              {/* Dates */}
              <p className="text-xs text-muted-foreground mt-1 hidden md:block relative z-10">
                {sign.dates}
              </p>

              {/* Arrow */}
              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
            </button>
          ))}
        </div>

        {/* Selected Sign Preview */}
        {selectedSign && (
          <div className="mt-8 p-6 md:p-8 rounded-xl bg-card border border-border animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={zodiacSigns.find(s => s.name === selectedSign)?.image} 
                  alt={selectedSign} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-2xl font-bold text-foreground mb-2">
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
