import { useState, useRef, type ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Camera,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";

interface AdvisorSetupWizardProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 4;

const SPECIALTY_OPTIONS = [
  "Tarot",
  "Astrology",
  "Numerology",
  "Dream Analysis",
  "Love Advice",
  "Career Guidance",
  "Energy Readings",
  "Mediumship",
  "Aura Reading",
  "Past Lives",
  "Intuitive Readings",
  "Spiritual Healing",
] as const;

type Specialty = (typeof SPECIALTY_OPTIONS)[number];

export default function AdvisorSetupWizard({
  onComplete,
}: AdvisorSetupWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 state
  const [title, setTitle] = useState("");
  const [bioShort, setBioShort] = useState("");

  // Step 2 state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3 state
  const [selectedSpecialties, setSelectedSpecialties] = useState<Specialty[]>(
    []
  );
  const [yearsExperience, setYearsExperience] = useState("");

  // Step 4 state
  const [pricePerMinute, setPricePerMinute] = useState("");

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return title.trim().length > 0;
      case 2:
        return true; // Photo is optional
      case 3:
        return selectedSpecialties.length >= 1;
      case 4:
        return parseFloat(pricePerMinute) > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS && canProceed()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
    if (file.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Avatar must be under 2 MB.", variant: "destructive" });
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" });
      e.target.value = '';
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${user.id}/avatar.${ext}`;

    setIsUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast({
          title: "Upload failed",
          description: uploadError.message,
          variant: "destructive",
        });
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: cacheBustedUrl })
        .eq("id", user.id);

      if (updateError) {
        toast({
          title: "Profile update failed",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      setAvatarUrl(cacheBustedUrl);
      toast({ title: "Photo uploaded successfully" });
    } catch (err) {
      toast({
        title: "Upload error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSpecialty = (specialty: Specialty) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handleFinish = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("advisor_details").upsert({
        id: user.id,
        title,
        bio_short: bioShort,
        specialties: selectedSpecialties,
        years_experience: parseInt(yearsExperience) || 0,
        price_per_minute: parseFloat(pricePerMinute),
        free_minutes: 0,
        status: "offline",
        profile_complete: true,
      });

      if (error) {
        toast({
          title: "Setup failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Profile setup complete!" });
      onComplete();
    } catch (err) {
      toast({
        title: "Something went wrong",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const userInitials =
    user?.firstName?.charAt(0)?.toUpperCase() ??
    user?.email?.charAt(0)?.toUpperCase() ??
    "?";

  // ─── Step renderers ────────────────────────────────────────

  const renderStepOne = () => (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <Sparkles className="h-10 w-10 mx-auto text-primary" />
        <h2 className="text-xl font-semibold">
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
        </h2>
        <p className="text-sm text-muted-foreground">
          Let's set up your advisor profile so clients can find you.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title / Tagline</Label>
        <Input
          id="title"
          placeholder='e.g. "5 Star Love Expert"'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">
          Short Bio{" "}
          <span className="text-muted-foreground font-normal">
            ({bioShort.length}/250)
          </span>
        </Label>
        <Textarea
          id="bio"
          placeholder="Tell clients a bit about yourself and your gifts..."
          maxLength={250}
          value={bioShort}
          onChange={(e) => setBioShort(e.target.value)}
          className="resize-none"
        />
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <Camera className="h-10 w-10 mx-auto text-primary" />
        <h2 className="text-xl font-semibold">Profile Photo</h2>
        <p className="text-sm text-muted-foreground">
          Upload a photo so clients can recognise you. You can skip this step
          and add one later.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-28 w-28 border-2 border-primary/30">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="Advisor avatar" />
          ) : null}
          <AvatarFallback className="text-3xl bg-primary/10 text-primary">
            {userInitials}
          </AvatarFallback>
        </Avatar>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />

        <Button
          variant="outline"
          loading={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {!isUploading && <Camera className="mr-2 h-4 w-4" />}
          {isUploading ? "Uploading..." : avatarUrl ? "Change Photo" : "Upload Photo"}
        </Button>
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <Sparkles className="h-10 w-10 mx-auto text-primary" />
        <h2 className="text-xl font-semibold">Your Specialties</h2>
        <p className="text-sm text-muted-foreground">
          Select at least one area of expertise.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {SPECIALTY_OPTIONS.map((specialty) => {
          const isSelected = selectedSpecialties.includes(specialty);
          return (
            <Badge
              key={specialty}
              variant={isSelected ? "default" : "outline"}
              className={`cursor-pointer select-none px-3 py-1.5 text-sm transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-primary/10"
              }`}
              onClick={() => toggleSpecialty(specialty)}
            >
              {isSelected && <Check className="mr-1 h-3 w-3" />}
              {specialty}
            </Badge>
          );
        })}
      </div>

      <div className="space-y-2 max-w-xs mx-auto">
        <Label htmlFor="experience">Years of Experience</Label>
        <Input
          id="experience"
          type="number"
          min={0}
          placeholder="e.g. 5"
          value={yearsExperience}
          onChange={(e) => setYearsExperience(e.target.value)}
        />
      </div>
    </div>
  );

  const renderStepFour = () => (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <Sparkles className="h-10 w-10 mx-auto text-primary" />
        <h2 className="text-xl font-semibold">Set Your Pricing</h2>
        <p className="text-sm text-muted-foreground">
          Choose a per-minute rate. You can change this any time.
        </p>
      </div>

      <div className="space-y-4 max-w-xs mx-auto">
        <div className="space-y-2">
          <Label htmlFor="price">Price per Minute</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <Input
              id="price"
              type="number"
              min={0}
              step={0.01}
              placeholder="3.99"
              className="pl-7"
              value={pricePerMinute}
              onChange={(e) => setPricePerMinute(e.target.value)}
            />
          </div>
        </div>

      </div>
    </div>
  );

  const stepRenderers: Record<number, () => JSX.Element> = {
    1: renderStepOne,
    2: renderStepTwo,
    3: renderStepThree,
    4: renderStepFour,
  };

  // ─── Main render ───────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg border-primary/20 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-center text-lg font-medium text-muted-foreground">
            Advisor Setup
          </CardTitle>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => {
              const step = i + 1;
              const isActive = step === currentStep;
              const isCompleted = step < currentStep;
              return (
                <div
                  key={step}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    isActive
                      ? "bg-primary scale-125"
                      : isCompleted
                        ? "bg-primary/60"
                        : "bg-muted-foreground/30"
                  }`}
                />
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {stepRenderers[currentStep]()}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-2">
            {currentStep > 1 ? (
              <Button variant="ghost" onClick={handleBack}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < TOTAL_STEPS ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="hero"
                onClick={handleFinish}
                disabled={!canProceed()}
                loading={isSubmitting}
              >
                {!isSubmitting && <Check className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Saving..." : "Finish Setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
