import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ProfileSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const getFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.firstName || '';
  };

  const [profileData, setProfileData] = useState({
    name: getFullName(),
    email: user?.email || '',
    phone: '',
    dateOfBirth: '',
  });

  const handleSaveProfile = () => {
    setIsEditProfileOpen(false);
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved.",
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
          <Button variant="outline" size="sm" onClick={() => setIsEditProfileOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-muted-foreground text-sm">Full Name</Label>
            <p className="text-foreground font-medium mt-1">{getFullName() || 'Not set'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Email Address</Label>
            <p className="text-foreground font-medium mt-1">{user?.email || 'Not set'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Phone Number</Label>
            <p className="text-foreground font-medium mt-1">Not set</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Date of Birth</Label>
            <p className="text-foreground font-medium mt-1">{user?.dateOfBirth || 'Not set'}</p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium text-foreground mb-4">Zodiac Sign</h3>
          <p className="text-muted-foreground text-sm">Add your date of birth to see your zodiac sign and get personalized horoscopes.</p>
        </div>
      </div>

      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditProfileOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSaveProfile}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileSettings;
