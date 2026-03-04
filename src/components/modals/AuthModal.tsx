import { useState, useEffect } from 'react';
import { Mail, Lock, User, Sparkles, Eye, EyeOff } from 'lucide-react';
import { TimePicker } from '@/components/ui/time-picker';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, SignUpData } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
  onSignupSuccess?: (firstName: string) => void;
}

export const AuthModal = ({ isOpen, onClose, mode: initialMode, onSignupSuccess }: AuthModalProps) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  const { login, signup, resetPassword, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setResetSent(false);
    resetForm();
  }, [initialMode, isOpen]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setUsername('');
    setDateOfBirth('');
    setTimeOfBirth('');
    setAgreed(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const isSignUp = mode === 'signup';

  const validateForm = (): string | null => {
    if (isSignUp) {
      if (!firstName.trim()) return 'First name is required';
      if (!lastName.trim()) return 'Last name is required';
      if (!username.trim()) return 'Username is required';
      if (!email.trim()) return 'Email is required';
      if (!password) return 'Password is required';
      if (password.length < 6) return 'Password must be at least 6 characters';
      if (password !== confirmPassword) return 'Passwords do not match';
      if (!agreed) return 'You must agree to the terms';
    } else {
      if (!email.trim()) return 'Email is required';
      if (!password) return 'Password is required';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const signUpData: SignUpData = {
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim(),
          dateOfBirth: dateOfBirth || undefined,
          timeOfBirth: timeOfBirth || undefined,
        };

        const result = await signup(signUpData);
        if (result.success) {
          onClose();
          onSignupSuccess?.(firstName.trim());
        } else {
          setError(result.error || 'Signup failed');
        }
      } else {
        const result = await login(email.trim(), password);
        if (result.success) {
          toast({ title: 'Welcome back!', description: 'You have signed in successfully.' });
          onClose();
        } else {
          setError(result.error || 'Login failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const result = await signInWithGoogle();
    if (!result.success) {
      setError(result.error || 'Google sign-in failed');
    }
    setIsLoading(false);
  };

  const handleForgotPassword = () => {
    setMode('forgot');
    setError('');
    setResetSent(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(email.trim());
      if (result.success) {
        setResetSent(true);
      } else {
        setError(result.error || 'Failed to send reset link');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const labelClass = "text-xs font-medium text-foreground/65 h-5 flex items-center";
  const inputClass = "pl-9 h-10 bg-input border-border text-sm";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg bg-card border-border p-0 max-h-[90vh] overflow-y-auto scrollbar-styled">

          {/* Header */}
          <div className="bg-hero-gradient px-8 py-5 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 left-6 w-1 h-1 bg-primary rounded-full animate-twinkle" />
              <div className="absolute top-5 right-10 w-1.5 h-1.5 bg-primary rounded-full animate-twinkle" style={{ animationDelay: '0.5s' }} />
              <div className="absolute bottom-3 left-1/3 w-1 h-1 bg-primary/70 rounded-full animate-twinkle" style={{ animationDelay: '1s' }} />
              <div className="absolute top-3 right-1/4 w-1 h-1 bg-secondary/60 rounded-full animate-twinkle" style={{ animationDelay: '1.5s' }} />
            </div>
            <div className="relative flex items-center justify-center gap-2.5 mb-1">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              <h2 className="font-heading text-xl font-semibold text-foreground">
                {mode === 'forgot' ? 'Reset Password' : isSignUp ? 'Begin Your Journey' : 'Welcome Back'}
              </h2>
            </div>
            <p className="relative text-muted-foreground text-xs">
              {mode === 'forgot' ? 'Enter your email to receive a reset link' : isSignUp ? 'Create your free account' : 'Sign in to continue'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={mode === 'forgot' ? handleResetPassword : handleSubmit} className="px-6 pt-4 pb-3 space-y-3">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {mode === 'forgot' ? (
              resetSent ? (
                <div className="py-4 space-y-4 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Check your email</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      We sent a password reset link to <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => { setMode('signin'); setResetSent(false); }}
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-secondary border-border"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="text-sm text-primary hover:underline"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </>
              )
            ) : isSignUp ? (
              <>
                {/* Group 1: Names — side by side */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className={labelClass}>First Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className={labelClass}>Last Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Group 2: Account identifiers — stacked, full width */}
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className={labelClass}>Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className={labelClass}>Username *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm leading-none select-none">@</span>
                      <Input
                        id="username"
                        type="text"
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        className="pl-7 h-10 bg-input border-border text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Group 3: Passwords — side by side */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className={labelClass}>Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 6 chars"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-10 h-10 bg-input border-border text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className={labelClass}>Confirm *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9 pr-10 h-10 bg-input border-border text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Group 4: Birth info — side by side (astrology context) */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className={`${labelClass} gap-1.5`}>
                      Date of Birth
                      <span className="text-[10px] font-sans font-medium text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-px leading-none">optional</span>
                    </Label>
                    <DatePicker
                      value={dateOfBirth}
                      onChange={setDateOfBirth}
                      placeholder="Select date"
                      fromYear={1920}
                      toYear={new Date().getFullYear() - 10}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={`${labelClass} gap-1.5`}>
                      Time of Birth
                      <span className="text-[10px] font-sans font-medium text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-px leading-none">optional</span>
                    </Label>
                    <TimePicker
                      value={timeOfBirth || "09:00"}
                      onChange={setTimeOfBirth}
                      className="w-full h-10"
                    />
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="terms"
                    checked={agreed}
                    onCheckedChange={(checked) => setAgreed(checked as boolean)}
                    className="mt-0.5 shrink-0"
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                    I agree to the{' '}
                    <a href="#" className="text-primary hover:underline font-medium">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a>
                  </label>
                </div>
              </>
            ) : (
              <>
                {/* Sign In */}
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className={labelClass}>Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className={labelClass}>Password</Label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-10 h-10 bg-input border-border text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {mode !== 'forgot' && (
              <>
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Please wait...' : (isSignUp ? 'Create Free Account' : 'Sign In')}
                </Button>

                {/* Social Login Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                {/* Social Login */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900 text-xs font-sans"
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-4 h-4 mr-1.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              </>
            )}
          </form>

          {/* Footer */}
          {mode !== 'forgot' && (
            <div className="px-6 py-3 bg-secondary/50 text-center border-t border-border/30">
              <p className="text-xs text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => setMode(isSignUp ? 'signin' : 'signup')}
                  className="text-primary font-medium hover:underline"
                >
                  {isSignUp ? 'Sign in' : 'Sign up free'}
                </button>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </>
  );
};
