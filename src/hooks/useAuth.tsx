import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  isAdvisor?: boolean;
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
  type: "chat" | "call";
  advisorId: string;
  advisorName: string;
  duration: number;
  creditsUsed: number;
  timestamp: Date;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth: string;
  timeOfBirth?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  credits: number;
  addCredits: (amount: number) => Promise<void>;
  savedCards: SavedCard[];
  addCard: (card: Omit<SavedCard, "id">) => void;
  deleteCard: (cardId: string) => void;
  setDefaultCard: (cardId: string) => void;
  getDefaultCard: () => SavedCard | undefined;
  sessionLogs: SessionLog[];
  addSessionLog: (log: Omit<SessionLog, "id">) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState<number>(0);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        const supabaseUser = session.user;
        const metadata = supabaseUser.user_metadata;

        // Fetch profile from database to get credits and role
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          firstName: metadata?.firstName,
          lastName: metadata?.lastName,
          username: profile?.username || metadata?.username,
          dateOfBirth: metadata?.dateOfBirth,
          timeOfBirth: metadata?.timeOfBirth,
          isAdvisor: profile?.role === 'advisor',
        });

        // Set credits from database
        if (profile) {
          setCredits(profile.credits || 0);
        }
      } else {
        setUser(null);
        setCredits(0);
      }
      setIsLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        const supabaseUser = session.user;
        const metadata = supabaseUser.user_metadata;

        // Fetch profile from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          firstName: metadata?.firstName,
          lastName: metadata?.lastName,
          username: profile?.username || metadata?.username,
          dateOfBirth: metadata?.dateOfBirth,
          timeOfBirth: metadata?.timeOfBirth,
          isAdvisor: profile?.role === 'advisor',
        });

        // Set credits from database
        if (profile) {
          setCredits(profile.credits || 0);
        }
      }
      setIsLoading(false);
    });

    // Load saved cards and session logs from localStorage (these remain local)
    const storedCards = localStorage.getItem("savedCards");
    const storedLogs = localStorage.getItem("sessionLogs");

    if (storedCards) setSavedCards(JSON.parse(storedCards));
    if (storedLogs) setSessionLogs(JSON.parse(storedLogs));

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      setUser({
        id: data.user.id,
        email: data.user.email!,
        firstName: data.user.user_metadata?.firstName,
        lastName: data.user.user_metadata?.lastName,
        username: profile.username,
        dateOfBirth: data.user.user_metadata?.dateOfBirth,
        timeOfBirth: data.user.user_metadata?.timeOfBirth,
        isAdvisor: profile.role === 'advisor',
      });

      setCredits(profile.credits || 0);

      return { success: true };
    } catch (err: any) {
      console.error('Login Error:', err);
      return { success: false, error: err.message };
    }
  };

  const signup = async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            dateOfBirth: data.dateOfBirth,
            timeOfBirth: data.timeOfBirth || null,
            isAdvisor: false,
          },
        },
      });

      if (error) throw error;

      // Profile is auto-created by database trigger
      return { success: true };
    } catch (err: any) {
      console.error('Signup Error:', err);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCredits(0);
    setSavedCards([]);
    setSessionLogs([]);

    // Clear localStorage
    localStorage.removeItem("savedCards");
    localStorage.removeItem("sessionLogs");
  };

  const addCredits = async (amount: number) => {
    if (!user?.id) return;

    // Add credits via Supabase RPC
    const { error } = await supabase.rpc('add_credits', {
      user_id: user.id,
      amount: amount,
    });

    if (error) {
      console.error('Error adding credits:', error);
      return;
    }

    // Refresh profile to get updated credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profile) {
      setCredits(profile.credits);
    }
  };

  const addSessionLog = (log: Omit<SessionLog, "id">) => {
    const newLog: SessionLog = {
      ...log,
      id: crypto.randomUUID(),
    };
    const newLogs = [newLog, ...sessionLogs];
    setSessionLogs(newLogs);
    localStorage.setItem("sessionLogs", JSON.stringify(newLogs));
  };

  const addCard = (card: Omit<SavedCard, "id">) => {
    const isFirstCard = savedCards.length === 0;
    const newCard: SavedCard = {
      ...card,
      id: crypto.randomUUID(),
      isDefault: isFirstCard,
    };
    const newCards = [...savedCards, newCard];
    setSavedCards(newCards);
    localStorage.setItem("savedCards", JSON.stringify(newCards));
  };

  const deleteCard = (cardId: string) => {
    const cardToDelete = savedCards.find((c) => c.id === cardId);
    let newCards = savedCards.filter((c) => c.id !== cardId);

    if (cardToDelete?.isDefault && newCards.length > 0) {
      newCards = newCards.map((c, index) => ({
        ...c,
        isDefault: index === 0,
      }));
    }

    setSavedCards(newCards);
    localStorage.setItem("savedCards", JSON.stringify(newCards));
  };

  const setDefaultCard = (cardId: string) => {
    const newCards = savedCards.map((card) => ({
      ...card,
      isDefault: card.id === cardId,
    }));
    setSavedCards(newCards);
    localStorage.setItem("savedCards", JSON.stringify(newCards));
  };

  const getDefaultCard = () => {
    return savedCards.find((card) => card.isDefault);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isLoading,
        credits,
        addCredits,
        savedCards,
        addCard,
        deleteCard,
        setDefaultCard,
        getDefaultCard,
        sessionLogs,
        addSessionLog,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
