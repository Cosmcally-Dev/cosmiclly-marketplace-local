import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const applicationSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email must be less than 255 characters"),
  specialty: z.string().trim().min(1, "Specialty is required").max(200, "Specialty must be less than 200 characters"),
  socialLink: z.string().trim().max(500, "Link must be less than 500 characters").optional(),
  extraInfo: z.string().trim().max(1000, "Message must be less than 1000 characters").optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface AdvisorApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvisorApplicationModal = ({ isOpen, onClose }: AdvisorApplicationModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ApplicationFormData>({
    fullName: "",
    email: "",
    specialty: "",
    socialLink: "",
    extraInfo: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationFormData, string>>>({});

  const handleChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const result = applicationSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ApplicationFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ApplicationFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(
        "https://automateoptinet.app.n8n.cloud/webhook-test/505e70cb-a6ff-4ffa-a0f8-96b626e30fb7",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            specialty: formData.specialty,
            socialLink: formData.socialLink || null,
            extraInfo: formData.extraInfo || null,
            submittedAt: new Date().toISOString(),
          }),
        },
      );

      const data = await response.json();

      if (data.success === true) {
        toast({
          title: "Success!",
          description: data.message || "Application Received!",
        });
        onClose();
        // Reset form
        setFormData({
          fullName: "",
          email: "",
          specialty: "",
          socialLink: "",
          extraInfo: "",
        });
        navigate("/advisor-portal");
      } else {
        toast({
          title: "Error",
          description: "Application failed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Application submission error:", error);
      toast({
        title: "Error",
        description: "Application failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading text-foreground">Apply as an Advisor</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Join our network of trusted spiritual advisors
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-foreground">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className={errors.fullName ? "border-destructive" : ""}
              disabled={isLoading}
            />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={errors.email ? "border-destructive" : ""}
              disabled={isLoading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty" className="text-foreground">
              Specialty <span className="text-destructive">*</span>
            </Label>
            <Input
              id="specialty"
              type="text"
              placeholder="e.g., Tarot Reading, Astrology, Medium"
              value={formData.specialty}
              onChange={(e) => handleChange("specialty", e.target.value)}
              className={errors.specialty ? "border-destructive" : ""}
              disabled={isLoading}
            />
            {errors.specialty && <p className="text-sm text-destructive">{errors.specialty}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="socialLink" className="text-foreground">
              Instagram or Website <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="socialLink"
              type="text"
              placeholder="https://instagram.com/yourhandle"
              value={formData.socialLink}
              onChange={(e) => handleChange("socialLink", e.target.value)}
              className={errors.socialLink ? "border-destructive" : ""}
              disabled={isLoading}
            />
            {errors.socialLink && <p className="text-sm text-destructive">{errors.socialLink}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="extraInfo" className="text-foreground">
              Want to share something extra? <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="extraInfo"
              placeholder="Tell us about your experience, certifications, or anything else..."
              value={formData.extraInfo}
              onChange={(e) => handleChange("extraInfo", e.target.value)}
              className={`min-h-[100px] ${errors.extraInfo ? "border-destructive" : ""}`}
              disabled={isLoading}
            />
            {errors.extraInfo && <p className="text-sm text-destructive">{errors.extraInfo}</p>}
          </div>

          <Button type="submit" variant="default" className="w-full mt-6" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Apply Now"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
