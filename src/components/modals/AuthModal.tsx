import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
}

export const AuthModal = ({ isOpen, onClose, mode: initialMode }: AuthModalProps) => {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);

  // Sync mode with prop when modal opens
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  const isSignUp = mode === 'signup';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle auth logic
    console.log({ email, password, name, agreed });
    onClose();
  };

  const handleGoogleLogin = () => {
    console.log('Google login');
    // Will integrate with Supabase later
  };

  const handleFacebookLogin = () => {
    console.log('Facebook login');
    // Will integrate with Supabase later
  };

  const handleForgotPassword = () => {
    console.log('Forgot password');
    // Will implement forgot password flow
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-hero-gradient p-6 text-center relative">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-2 left-4 w-1 h-1 bg-accent rounded-full animate-twinkle" />
            <div className="absolute top-8 right-8 w-1.5 h-1.5 bg-accent rounded-full animate-twinkle" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-4 left-1/4 w-1 h-1 bg-accent/70 rounded-full animate-twinkle" style={{ animationDelay: '1s' }} />
          </div>
          <Sparkles className="w-12 h-12 text-accent mx-auto mb-3" />
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            {isSignUp ? 'Begin Your Journey' : 'Welcome Back'}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {isSignUp ? 'Create your free account' : 'Sign in to continue'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 h-12 bg-secondary border-border"
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-secondary border-border"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12 bg-secondary border-border"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Forgot Password - only show on signin */}
          {!isSignUp && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-accent hover:text-accent/80 hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {isSignUp && (
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to the{' '}
                <a href="#" className="text-accent hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-accent hover:underline">Privacy Policy</a>
              </label>
            </div>
          )}

          <Button type="submit" variant="hero" size="lg" className="w-full">
            {isSignUp ? 'Create Free Account' : 'Sign In'}
          </Button>

          {/* Social Login Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            {/* Facebook Login */}
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-12 bg-[#1877F2] hover:bg-[#166FE5] border-[#1877F2] hover:border-[#166FE5] text-white hover:text-white"
              onClick={handleFacebookLogin}
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </Button>

            {/* Google Login */}
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-12 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-secondary/50 text-center">
          <p className="text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setMode(isSignUp ? 'signin' : 'signup')}
              className="text-accent font-medium hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up free'}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
