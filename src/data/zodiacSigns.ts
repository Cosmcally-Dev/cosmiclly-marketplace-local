import ariesImg from '@/assets/zodiac/aries.png';
import taurusImg from '@/assets/zodiac/taurus.png';
import geminiImg from '@/assets/zodiac/gemini.png';
import cancerImg from '@/assets/zodiac/cancer.png';
import leoImg from '@/assets/zodiac/leo.png';
import virgoImg from '@/assets/zodiac/virgo.png';
import libraImg from '@/assets/zodiac/libra.png';
import scorpioImg from '@/assets/zodiac/scorpio.png';
import sagittariusImg from '@/assets/zodiac/sagittarius.png';
import capricornImg from '@/assets/zodiac/capricorn.png';
import aquariusImg from '@/assets/zodiac/aquarius.png';
import piscesImg from '@/assets/zodiac/pisces.png';

export interface ZodiacSign {
  name: string;
  symbol: string;
  dates: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  ruling: string;
  image: string;
}

export const zodiacSigns: ZodiacSign[] = [
  { 
    name: 'Aries', 
    symbol: '♈', 
    dates: 'Mar 21 - Apr 19',
    element: 'Fire',
    ruling: 'Mars',
    image: ariesImg
  },
  { 
    name: 'Taurus', 
    symbol: '♉', 
    dates: 'Apr 20 - May 20',
    element: 'Earth',
    ruling: 'Venus',
    image: taurusImg
  },
  { 
    name: 'Gemini', 
    symbol: '♊', 
    dates: 'May 21 - Jun 20',
    element: 'Air',
    ruling: 'Mercury',
    image: geminiImg
  },
  { 
    name: 'Cancer', 
    symbol: '♋', 
    dates: 'Jun 21 - Jul 22',
    element: 'Water',
    ruling: 'Moon',
    image: cancerImg
  },
  { 
    name: 'Leo', 
    symbol: '♌', 
    dates: 'Jul 23 - Aug 22',
    element: 'Fire',
    ruling: 'Sun',
    image: leoImg
  },
  { 
    name: 'Virgo', 
    symbol: '♍', 
    dates: 'Aug 23 - Sep 22',
    element: 'Earth',
    ruling: 'Mercury',
    image: virgoImg
  },
  { 
    name: 'Libra', 
    symbol: '♎', 
    dates: 'Sep 23 - Oct 22',
    element: 'Air',
    ruling: 'Venus',
    image: libraImg
  },
  { 
    name: 'Scorpio', 
    symbol: '♏', 
    dates: 'Oct 23 - Nov 21',
    element: 'Water',
    ruling: 'Pluto',
    image: scorpioImg
  },
  { 
    name: 'Sagittarius', 
    symbol: '♐', 
    dates: 'Nov 22 - Dec 21',
    element: 'Fire',
    ruling: 'Jupiter',
    image: sagittariusImg
  },
  { 
    name: 'Capricorn', 
    symbol: '♑', 
    dates: 'Dec 22 - Jan 19',
    element: 'Earth',
    ruling: 'Saturn',
    image: capricornImg
  },
  { 
    name: 'Aquarius', 
    symbol: '♒', 
    dates: 'Jan 20 - Feb 18',
    element: 'Air',
    ruling: 'Uranus',
    image: aquariusImg
  },
  { 
    name: 'Pisces', 
    symbol: '♓', 
    dates: 'Feb 19 - Mar 20',
    element: 'Water',
    ruling: 'Neptune',
    image: piscesImg
  },
];

export const elementColors = {
  Fire: 'from-orange-500 to-red-600',
  Earth: 'from-emerald-500 to-green-600',
  Air: 'from-sky-500 to-blue-600',
  Water: 'from-blue-500 to-indigo-600',
};

export const getZodiacByName = (name: string): ZodiacSign | undefined => {
  return zodiacSigns.find(sign => sign.name.toLowerCase() === name.toLowerCase());
};
