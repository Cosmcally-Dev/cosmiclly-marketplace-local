export interface HoroscopeContentEntry {
  daily: string;
  love: string;
  career: string;
  money: string;
  health: string;
  lucky: {
    numbers: number[];
    color: string;
    time: string;
  };
}

// Keyed by lowercase sign name to match DB `sign` column convention
export const horoscopeContent: Record<string, HoroscopeContentEntry> = {
  aries: {
    daily: "Today brings exciting opportunities for personal growth. Your natural leadership qualities shine bright, attracting positive attention from colleagues and friends alike. Trust your instincts when making important decisions.",
    love: "Romance is in the air! Singles may encounter an intriguing connection through mutual friends. Couples should plan a spontaneous adventure together.",
    career: "A bold move at work could lead to unexpected rewards. Don't hesitate to voice your innovative ideas in meetings.",
    money: "Financial prospects look favorable. Consider investing in personal development or a passion project.",
    health: "Your energy levels are high. Channel this vitality into physical activities that challenge you.",
    lucky: { numbers: [7, 14, 21], color: 'Red', time: '2:00 PM' },
  },
  taurus: {
    daily: "Stability is your theme today. Focus on nurturing your relationships and home environment. A practical approach to challenges will serve you well.",
    love: "Deep conversations strengthen emotional bonds. Express your feelings openly to your partner or someone special.",
    career: "Your persistence pays off with recognition from superiors. Stay committed to your current projects.",
    money: "A wise investment opportunity may present itself. Trust your natural ability to assess value.",
    health: "Take time to relax and recharge. A spa day or nature walk would do wonders for your wellbeing.",
    lucky: { numbers: [4, 11, 29], color: 'Green', time: '6:00 PM' },
  },
  gemini: {
    daily: "Your communication skills are heightened today. Use this gift to bridge gaps and create new connections. Multiple opportunities may present themselves simultaneously.",
    love: "Playful banter leads to deeper understanding. Let your wit charm someone special today.",
    career: "Networking events favor you strongly. Make meaningful connections that could benefit your career path.",
    money: "Multiple income streams may become available. Stay adaptable to capitalize on opportunities.",
    health: "Mental stimulation is key. Engage in puzzles, reading, or learning something new.",
    lucky: { numbers: [3, 17, 25], color: 'Yellow', time: '11:00 AM' },
  },
  cancer: {
    daily: "Emotional intuition guides you today. Trust your feelings when navigating complex situations. Home and family matters take priority.",
    love: "Nurturing gestures speak louder than words. Show your love through thoughtful acts of care.",
    career: "Your empathetic nature helps resolve workplace conflicts. Colleagues seek your counsel.",
    money: "Focus on building security. Small, consistent savings will grow substantially over time.",
    health: "Emotional wellness is paramount. Practice self-care rituals that soothe your sensitive soul.",
    lucky: { numbers: [2, 16, 28], color: 'Silver', time: '9:00 PM' },
  },
  leo: {
    daily: "The spotlight finds you naturally today. Your charisma attracts admirers and opportunities. Express your creative talents boldly.",
    love: "Romance flourishes under your warm attention. Plan a grand gesture to impress your love interest.",
    career: "Leadership opportunities arise. Step into roles that showcase your natural command presence.",
    money: "Generosity brings unexpected returns. Share your abundance and watch it multiply.",
    health: "Heart health deserves attention. Cardio exercises and joyful activities boost your vitality.",
    lucky: { numbers: [1, 10, 19], color: 'Gold', time: '12:00 PM' },
  },
  virgo: {
    daily: "Attention to detail serves you exceptionally well today. Your analytical mind solves problems others overlook. Organization brings peace.",
    love: "Quality time matters more than grand gestures. Appreciate the small moments of connection.",
    career: "Your expertise is recognized and valued. Take pride in the excellence you consistently deliver.",
    money: "Budget reviews reveal opportunities for savings. Your practical nature guides wise financial decisions.",
    health: "Routine health practices pay dividends. Maintain your wellness regimen with dedication.",
    lucky: { numbers: [5, 14, 23], color: 'Navy Blue', time: '3:00 PM' },
  },
  libra: {
    daily: "Balance and harmony are your allies today. Diplomatic skills help navigate tricky social waters. Beauty and art inspire your soul.",
    love: "Partnership dynamics improve through honest communication. Seek fairness in all relationship matters.",
    career: "Collaborative projects thrive under your guidance. Bring people together for shared success.",
    money: "Joint ventures look promising. Consider partnerships that align with your values.",
    health: "Mental equilibrium supports physical health. Meditation and peaceful environments restore you.",
    lucky: { numbers: [6, 15, 24], color: 'Pink', time: '7:00 PM' },
  },
  scorpio: {
    daily: "Transformation energy surrounds you. Deep insights surface, revealing hidden truths. Trust your powerful intuition today.",
    love: "Intensity deepens romantic connections. Vulnerability creates lasting bonds with your partner.",
    career: "Research and investigation yield important discoveries. Your persistence uncovers valuable information.",
    money: "Investments in yourself bring the highest returns. Consider education or skill development.",
    health: "Emotional release promotes physical healing. Allow yourself to process and let go.",
    lucky: { numbers: [8, 13, 22], color: 'Black', time: '10:00 PM' },
  },
  sagittarius: {
    daily: "Adventure calls to your free spirit today. Expand your horizons through travel, learning, or new experiences. Optimism attracts good fortune.",
    love: "Shared adventures strengthen romantic bonds. Plan an exciting journey with someone special.",
    career: "International opportunities or higher education paths open up. Think big and aim high.",
    money: "Lucky breaks in financial matters favor the bold. Take calculated risks with confidence.",
    health: "Outdoor activities invigorate your spirit. Hiking, sports, or travel rejuvenate you completely.",
    lucky: { numbers: [9, 18, 27], color: 'Purple', time: '4:00 PM' },
  },
  capricorn: {
    daily: "Discipline and determination propel you forward. Long-term goals come into sharper focus. Your patience and persistence are rewarded.",
    love: "Commitment and loyalty define your romantic approach. Stable, mature relationships thrive now.",
    career: "Authority figures recognize your dedication. Promotions or increased responsibilities are possible.",
    money: "Conservative financial strategies prove wise. Build wealth through steady, reliable methods.",
    health: "Bone and joint health deserve attention. Weight-bearing exercises strengthen your foundation.",
    lucky: { numbers: [10, 20, 30], color: 'Brown', time: '8:00 AM' },
  },
  aquarius: {
    daily: "Innovation and originality mark your day. Unique ideas set you apart from the crowd. Humanitarian concerns inspire meaningful action.",
    love: "Intellectual connection sparks romantic interest. Find someone who appreciates your unique perspective.",
    career: "Technology and progressive approaches favor your work. Embrace unconventional methods.",
    money: "Investments in innovation and technology show promise. Think ahead of current trends.",
    health: "Circulation and nervous system wellness matter. Social connections boost your overall health.",
    lucky: { numbers: [11, 22, 29], color: 'Electric Blue', time: '1:00 PM' },
  },
  pisces: {
    daily: "Intuition and creativity flow abundantly. Artistic pursuits bring deep satisfaction. Dreams hold meaningful messages today.",
    love: "Soulmate energy surrounds you. Trust the universe to guide romantic matters perfectly.",
    career: "Creative projects gain momentum. Your imaginative approach solves problems innovatively.",
    money: "Intuitive financial decisions prove accurate. Trust your gut feelings about investments.",
    health: "Water-related activities heal and restore. Swimming, baths, or time near water benefits you.",
    lucky: { numbers: [12, 21, 30], color: 'Sea Green', time: '5:00 PM' },
  },
};
