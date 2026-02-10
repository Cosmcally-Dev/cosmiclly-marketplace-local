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
  addCredits: (amount: number) => void;
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
    // Check for custom stored user (for n8n/Airtable flow)
    const storedUser = localStorage.getItem("optinet_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setSession({ user: { id: "airtable-user" } } as any);
    }

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        const supabaseUser = session.user;
        const metadata = supabaseUser.user_metadata;
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          firstName: metadata?.firstName,
          lastName: metadata?.lastName,
          username: metadata?.username,
          dateOfBirth: metadata?.dateOfBirth,
          timeOfBirth: metadata?.timeOfBirth,
          isAdvisor: metadata?.isAdvisor || false,
        });
      } else {
        // ONLY clear user if we don't have a custom one in local storage
        if (!localStorage.getItem("optinet_user")) {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Only override if Supabase actually has a session
      if (session?.user) {
        setSession(session);
        const supabaseUser = session.user;
        const metadata = supabaseUser.user_metadata;
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          firstName: metadata?.firstName,
          lastName: metadata?.lastName,
          username: metadata?.username,
          dateOfBirth: metadata?.dateOfBirth,
          timeOfBirth: metadata?.timeOfBirth,
          isAdvisor: metadata?.isAdvisor || false,
        });
      }
      setIsLoading(false);
    });

    // Load credits and cards from localStorage
    const storedCredits = localStorage.getItem("credits");
    const storedCards = localStorage.getItem("savedCards");
    const storedLogs = localStorage.getItem("sessionLogs");

    if (storedCredits) setCredits(JSON.parse(storedCredits));
    if (storedCards) setSavedCards(JSON.parse(storedCards));
    if (storedLogs) setSessionLogs(JSON.parse(storedLogs));

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Direct POST to n8n webhook for Airtable authentication
      const response = await fetch(
        "https://automateoptinet.app.n8n.cloud/webhook/99d434f6-0822-435e-8c9d-cb225500f2c2",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      const result = await response.json();

      // Check for the success flag and username returned from Airtable/n8n
      if (result.success === true) {
        const newUser: User = {
          id: result.id || crypto.randomUUID(), // Use ID from webhook if available, else random
          email: email,
          username: result.username,
          firstName: result.firstName, // If your webhook returns these, good to map them
          lastName: result.lastName,
        };

        setUser(newUser);

        // Set a mock session to satisfy isAuthenticated checks elsewhere in the app
        setSession({ user: { id: "airtable-user" } } as any);

        // PERSIST CUSTOM USER
        localStorage.setItem("optinet_user", JSON.stringify(newUser));

        return { success: true };
      } else {
        return { success: false, error: result.message || "Invalid email or password." };
      }
    } catch (err: any) {
      console.error("Airtable Login Error:", err);
      return { success: false, error: err.message || "Login failed" };
    }
  };

  const signup = async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    try {
      // TESTING: Trigger N8N Webhook instead of Supabase
      const response = await fetch(
        "https://automateoptinet.app.n8n.cloud/webhook/505e70cb-a6ff-4ffa-a0f8-96b626e30fb7",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            dateOfBirth: data.dateOfBirth,
            timeOfBirth: data.timeOfBirth || null,
          }),
        },
      );

      const result = await response.json();

      if (result.success === true) {
        return { success: true };
      } else {
        return { success: false, error: result.message || "Signup failed" };
      }
    } catch (err: any) {
      console.error("Signup Error:", err);
      return { success: false, error: err.message || "Signup failed" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCredits(0);
    setSavedCards([]);
    setSessionLogs([]);

    // Clear all storage including custom user
    localStorage.removeItem("credits");
    localStorage.removeItem("savedCards");
    localStorage.removeItem("sessionLogs");
    localStorage.removeItem("optinet_user");
  };

  const addCredits = (amount: number) => {
    const newCredits = Math.max(0, credits + amount);
    setCredits(newCredits);
    localStorage.setItem("credits", JSON.stringify(newCredits));
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
