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
  modality: 'Cardinal' | 'Fixed' | 'Mutable';
  ruling: string;
  image: string;
}

export const zodiacSigns: ZodiacSign[] = [
  {
    name: 'Aries',
    symbol: '♈',
    dates: 'Mar 21 - Apr 19',
    element: 'Fire',
    modality: 'Cardinal',
    ruling: 'Mars',
    image: ariesImg
  },
  {
    name: 'Taurus',
    symbol: '♉',
    dates: 'Apr 20 - May 20',
    element: 'Earth',
    modality: 'Fixed',
    ruling: 'Venus',
    image: taurusImg
  },
  {
    name: 'Gemini',
    symbol: '♊',
    dates: 'May 21 - Jun 20',
    element: 'Air',
    modality: 'Mutable',
    ruling: 'Mercury',
    image: geminiImg
  },
  {
    name: 'Cancer',
    symbol: '♋',
    dates: 'Jun 21 - Jul 22',
    element: 'Water',
    modality: 'Cardinal',
    ruling: 'Moon',
    image: cancerImg
  },
  {
    name: 'Leo',
    symbol: '♌',
    dates: 'Jul 23 - Aug 22',
    element: 'Fire',
    modality: 'Fixed',
    ruling: 'Sun',
    image: leoImg
  },
  {
    name: 'Virgo',
    symbol: '♍',
    dates: 'Aug 23 - Sep 22',
    element: 'Earth',
    modality: 'Mutable',
    ruling: 'Mercury',
    image: virgoImg
  },
  {
    name: 'Libra',
    symbol: '♎',
    dates: 'Sep 23 - Oct 22',
    element: 'Air',
    modality: 'Cardinal',
    ruling: 'Venus',
    image: libraImg
  },
  {
    name: 'Scorpio',
    symbol: '♏',
    dates: 'Oct 23 - Nov 21',
    element: 'Water',
    modality: 'Fixed',
    ruling: 'Pluto',
    image: scorpioImg
  },
  {
    name: 'Sagittarius',
    symbol: '♐',
    dates: 'Nov 22 - Dec 21',
    element: 'Fire',
    modality: 'Mutable',
    ruling: 'Jupiter',
    image: sagittariusImg
  },
  {
    name: 'Capricorn',
    symbol: '♑',
    dates: 'Dec 22 - Jan 19',
    element: 'Earth',
    modality: 'Cardinal',
    ruling: 'Saturn',
    image: capricornImg
  },
  {
    name: 'Aquarius',
    symbol: '♒',
    dates: 'Jan 20 - Feb 18',
    element: 'Air',
    modality: 'Fixed',
    ruling: 'Uranus',
    image: aquariusImg
  },
  {
    name: 'Pisces',
    symbol: '♓',
    dates: 'Feb 19 - Mar 20',
    element: 'Water',
    modality: 'Mutable',
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

/** Date ranges as [startMonth, startDay, endMonth, endDay] */
const zodiacDateRanges: [number, number, number, number][] = [
  [3, 21, 4, 19],   // Aries
  [4, 20, 5, 20],   // Taurus
  [5, 21, 6, 20],   // Gemini
  [6, 21, 7, 22],   // Cancer
  [7, 23, 8, 22],   // Leo
  [8, 23, 9, 22],   // Virgo
  [9, 23, 10, 22],  // Libra
  [10, 23, 11, 21], // Scorpio
  [11, 22, 12, 21], // Sagittarius
  [12, 22, 1, 19],  // Capricorn (spans year boundary)
  [1, 20, 2, 18],   // Aquarius
  [2, 19, 3, 20],   // Pisces
];

/**
 * Determines the zodiac sign from a date of birth string.
 * Accepts formats like "1998-03-06", "03/06/1998", or any Date-parseable string.
 */
export const getZodiacFromBirthday = (dateStr: string): ZodiacSign | undefined => {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return undefined;

  const month = d.getMonth() + 1; // 1-12
  const day = d.getDate();

  for (let i = 0; i < zodiacDateRanges.length; i++) {
    const [sm, sd, em, ed] = zodiacDateRanges[i];

    if (sm <= em) {
      // Normal range (same year)
      if ((month === sm && day >= sd) || (month === em && day <= ed) || (month > sm && month < em)) {
        return zodiacSigns[i];
      }
    } else {
      // Year-spanning range (Capricorn: Dec 22 – Jan 19)
      if ((month === sm && day >= sd) || (month === em && day <= ed) || month > sm || month < em) {
        return zodiacSigns[i];
      }
    }
  }

  return undefined;
};
