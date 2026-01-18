import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  name?: string;
}

interface SavedCard {
  id: string;
  cardholderName: string;
  lastFourDigits: string;
  expirationDate: string;
  isDefault?: boolean;
}

export interface SessionLog {
  id: string;
  type: 'chat' | 'call';
  advisorId: string;
  advisorName: string;
  duration: number; // in seconds
  creditsUsed: number;
  timestamp: Date;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (email: string, password: string, name: string) => { success: boolean; error?: string };
  logout: () => void;
  isAuthenticated: boolean;
  credits: number;
  addCredits: (amount: number) => void;
  savedCards: SavedCard[];
  addCard: (card: Omit<SavedCard, 'id'>) => void;
  deleteCard: (cardId: string) => void;
  setDefaultCard: (cardId: string) => void;
  getDefaultCard: () => SavedCard | undefined;
  sessionLogs: SessionLog[];
  addSessionLog: (log: Omit<SessionLog, 'id'>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Test account credentials
const TEST_ACCOUNTS = [
  { email: 'testclient', password: '1234', name: 'Test Client' }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);

  useEffect(() => {
    // Check session storage on mount
    const storedUser = sessionStorage.getItem('user');
    const storedCredits = sessionStorage.getItem('credits');
    const storedCards = sessionStorage.getItem('savedCards');
    const storedLogs = sessionStorage.getItem('sessionLogs');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedCredits) {
      setCredits(JSON.parse(storedCredits));
    }
    if (storedCards) {
      setSavedCards(JSON.parse(storedCards));
    }
    if (storedLogs) {
      setSessionLogs(JSON.parse(storedLogs));
    }
  }, []);

  const login = (email: string, password: string) => {
    const account = TEST_ACCOUNTS.find(
      (acc) => acc.email === email && acc.password === password
    );

    if (account) {
      const userData = { email: account.email, name: account.name };
      setUser(userData);
      sessionStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    }

    return { success: false, error: 'Invalid email or password' };
  };

  const signup = (email: string, password: string, name: string) => {
    // For MVP, just create a session
    const userData = { email, name };
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setCredits(0);
    setSavedCards([]);
    setSessionLogs([]);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('credits');
    sessionStorage.removeItem('savedCards');
    sessionStorage.removeItem('sessionLogs');
  };

  const addCredits = (amount: number) => {
    const newCredits = Math.max(0, credits + amount);
    setCredits(newCredits);
    sessionStorage.setItem('credits', JSON.stringify(newCredits));
  };

  const addSessionLog = (log: Omit<SessionLog, 'id'>) => {
    const newLog: SessionLog = {
      ...log,
      id: crypto.randomUUID(),
    };
    const newLogs = [newLog, ...sessionLogs];
    setSessionLogs(newLogs);
    sessionStorage.setItem('sessionLogs', JSON.stringify(newLogs));
  };

  const addCard = (card: Omit<SavedCard, 'id'>) => {
    const isFirstCard = savedCards.length === 0;
    const newCard: SavedCard = {
      ...card,
      id: crypto.randomUUID(),
      isDefault: isFirstCard, // First card is default
    };
    const newCards = [...savedCards, newCard];
    setSavedCards(newCards);
    sessionStorage.setItem('savedCards', JSON.stringify(newCards));
  };

  const deleteCard = (cardId: string) => {
    const cardToDelete = savedCards.find(c => c.id === cardId);
    let newCards = savedCards.filter(c => c.id !== cardId);
    
    // If we deleted the default card, set the first remaining card as default
    if (cardToDelete?.isDefault && newCards.length > 0) {
      newCards = newCards.map((c, index) => ({
        ...c,
        isDefault: index === 0,
      }));
    }
    
    setSavedCards(newCards);
    sessionStorage.setItem('savedCards', JSON.stringify(newCards));
  };

  const setDefaultCard = (cardId: string) => {
    const newCards = savedCards.map(card => ({
      ...card,
      isDefault: card.id === cardId,
    }));
    setSavedCards(newCards);
    sessionStorage.setItem('savedCards', JSON.stringify(newCards));
  };

  const getDefaultCard = () => {
    return savedCards.find(card => card.isDefault);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      isAuthenticated: !!user,
      credits,
      addCredits,
      savedCards,
      addCard,
      deleteCard,
      setDefaultCard,
      getDefaultCard,
      sessionLogs,
      addSessionLog,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
