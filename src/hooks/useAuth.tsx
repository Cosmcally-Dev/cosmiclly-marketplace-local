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
  isAdmin?: boolean;
  avatarUrl?: string;
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

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  username?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: UpdateProfileData) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => void;
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
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  // Build a User object from Supabase auth user + optional profile data
  const buildUserFromSession = (
    supabaseUser: SupabaseUser,
    profile: Record<string, any> | null
  ): User => {
    const metadata = supabaseUser.user_metadata;
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      firstName: metadata?.firstName,
      lastName: metadata?.lastName,
      username: profile?.username || metadata?.username,
      dateOfBirth: metadata?.dateOfBirth,
      timeOfBirth: metadata?.timeOfBirth,
      isAdvisor: profile?.role === 'advisor' || profile?.role === 'admin' || metadata?.isAdvisor === true,
      isAdmin: profile?.role === 'admin',
      avatarUrl: profile?.avatar_url || undefined,
    };
  };

  // Safely fetch profile, returns null on any error
  const fetchProfile = async (userId: string): Promise<Record<string, any> | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.warn('[useAuth] Profile fetch error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[useAuth] Profile fetch exception:', err);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    // IMPORTANT: Do NOT use async callback — Supabase warns this can cause deadlocks.
    // Set user immediately from JWT metadata, then defer profile fetch.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Detect password recovery flow from email reset link
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      setSession(session);
      if (session?.user) {
        // Set user immediately from JWT metadata (no await needed)
        setUser(buildUserFromSession(session.user, null));

        // Defer profile fetch to avoid blocking the auth callback
        const userId = session.user.id;
        setTimeout(() => {
          fetchProfile(userId)
            .then((profile) => {
              if (profile) {
                setUser(buildUserFromSession(session.user, profile));
                setCredits(profile.credits || 0);
              }
            })
            .catch((err) => {
              console.warn('[useAuth] Deferred profile fetch failed:', err);
            })
            .finally(() => {
              setIsLoading(false);
            });
        }, 0);
      } else {
        setUser(null);
        setCredits(0);
        setIsLoading(false);
      }
    });

    // Check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setSession(session);
          // Set user immediately from metadata
          setUser(buildUserFromSession(session.user, null));

          // Then fetch profile for credits/role
          fetchProfile(session.user.id)
            .then((profile) => {
              if (profile) {
                setUser(buildUserFromSession(session.user, profile));
                setCredits(profile.credits || 0);
              }
            })
            .catch((err) => {
              console.warn('[useAuth] getSession profile fetch failed:', err);
            })
            .finally(() => {
              setIsLoading(false);
            });
        } else {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('[useAuth] getSession error:', err);
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

      // Set user immediately from auth metadata
      setUser(buildUserFromSession(data.user, null));

      // Then fetch profile for credits and role (non-blocking for login success)
      const profile = await fetchProfile(data.user.id);
      if (profile) {
        setUser(buildUserFromSession(data.user, profile));
        setCredits(profile.credits || 0);
      }

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

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`,
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Reset password error:', err);
      return { success: false, error: err.message };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Update password error:', err);
      return { success: false, error: err.message };
    }
  };

  const updateProfile = async (data: UpdateProfileData): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      // Update profiles table
      const profileUpdate: Record<string, any> = {};
      if (data.firstName !== undefined || data.lastName !== undefined) {
        profileUpdate.full_name = `${data.firstName || user.firstName || ''} ${data.lastName || user.lastName || ''}`.trim();
      }
      if (data.username !== undefined) profileUpdate.username = data.username;

      if (Object.keys(profileUpdate).length > 0) {
        const { error: dbError } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', user.id);
        if (dbError) throw dbError;
      }

      // Update auth metadata
      const metadataUpdate: Record<string, any> = {};
      if (data.firstName !== undefined) metadataUpdate.firstName = data.firstName;
      if (data.lastName !== undefined) metadataUpdate.lastName = data.lastName;
      if (data.username !== undefined) metadataUpdate.username = data.username;
      if (data.dateOfBirth !== undefined) metadataUpdate.dateOfBirth = data.dateOfBirth;
      if (data.timeOfBirth !== undefined) metadataUpdate.timeOfBirth = data.timeOfBirth;

      if (Object.keys(metadataUpdate).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({ data: metadataUpdate });
        if (authError) throw authError;
      }

      // Refresh local user state
      const profile = await fetchProfile(user.id);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        setUser(buildUserFromSession(currentSession.user, profile));
      }

      return { success: true };
    } catch (err: any) {
      console.error('Update profile error:', err);
      return { success: false, error: err.message };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      return { success: false, error: err.message };
    }
  };

  const clearPasswordRecovery = () => {
    setIsPasswordRecovery(false);
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
        resetPassword,
        updatePassword,
        updateProfile,
        signInWithGoogle,
        isPasswordRecovery,
        clearPasswordRecovery,
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
