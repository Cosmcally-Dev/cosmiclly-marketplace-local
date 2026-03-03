import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdvisorContractUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

interface AdvisorContractModalProps {
  user: AdvisorContractUser | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ContractData {
  advisor_share_percent: number;
  platform_share_percent: number;
  admin_fee_percent: number;
  contract_locked: boolean;
  contract_locked_at: string | null;
}

export const AdvisorContractModal = ({ user, isOpen, onClose }: AdvisorContractModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [advisorShare, setAdvisorShare] = useState('50');
  const [platformShare, setPlatformShare] = useState('50');
  const [adminFee, setAdminFee] = useState('5');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !isOpen) return;

    const fetchContract = async () => {
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('advisor_details')
          .select('advisor_share_percent, platform_share_percent, admin_fee_percent, contract_locked, contract_locked_at')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.warn('[AdvisorContractModal] Fetch error:', fetchError.message);
          setContract(null);
        } else if (data) {
          const d = data as unknown as ContractData;
          setContract(d);
          setAdvisorShare(String(d.advisor_share_percent ?? 50));
          setPlatformShare(String(d.platform_share_percent ?? 50));
          setAdminFee(String(d.admin_fee_percent ?? 5));
        }
      } catch (err) {
        console.warn('[AdvisorContractModal] Exception:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContract();
  }, [user, isOpen]);

  const handleAdvisorShareChange = (val: string) => {
    setAdvisorShare(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setPlatformShare((100 - num).toFixed(0));
      setError('');
    }
  };

  const handlePlatformShareChange = (val: string) => {
    setPlatformShare(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setAdvisorShare((100 - num).toFixed(0));
      setError('');
    }
  };

  const handleSave = async (lock: boolean) => {
    const aShare = parseFloat(advisorShare);
    const pShare = parseFloat(platformShare);
    const fee = parseFloat(adminFee);

    if (isNaN(aShare) || isNaN(pShare) || isNaN(fee)) {
      setError('All fields must be valid numbers');
      return;
    }
    if (aShare + pShare !== 100) {
      setError('Advisor + Platform share must equal 100%');
      return;
    }
    if (fee < 0 || fee > 100) {
      setError('Admin fee must be between 0 and 100');
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const { error: rpcError } = await supabase.rpc('update_advisor_contract', {
        p_advisor_id: user!.id,
        p_advisor_share: aShare,
        p_platform_share: pShare,
        p_admin_fee: fee,
        p_lock: lock,
      });

      if (rpcError) throw rpcError;

      toast({
        title: lock ? 'Contract Locked' : 'Contract Saved',
        description: lock
          ? 'The contract has been locked and cannot be modified.'
          : 'Contract terms have been updated.',
      });

      if (lock) {
        setContract((prev) => prev ? { ...prev, contract_locked: true, contract_locked_at: new Date().toISOString() } : prev);
      }
    } catch (err: any) {
      console.error('[AdvisorContractModal] Save error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  const isLocked = contract?.contract_locked === true;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Advisor Contract
            {isLocked ? (
              <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </Badge>
            ) : (
              <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                <Unlock className="w-3 h-3 mr-1" />
                Editable
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Advisor Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Name</Label>
              <p className="text-foreground font-medium">{user.full_name || '—'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="text-foreground text-sm">{user.email}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !contract ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No advisor details found for this user.</p>
            </div>
          ) : (
            <>
              {/* Contract Fields */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                <Label className="text-foreground font-medium text-sm">Revenue Split</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-muted-foreground text-xs">Advisor %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={advisorShare}
                      onChange={(e) => handleAdvisorShareChange(e.target.value)}
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Platform %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={platformShare}
                      onChange={(e) => handlePlatformShareChange(e.target.value)}
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Admin Fee %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={adminFee}
                      onChange={(e) => { setAdminFee(e.target.value); setError(''); }}
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  $100 session → {adminFee}% fee (${(100 * parseFloat(adminFee || '0') / 100).toFixed(2)}) → ${(100 - 100 * parseFloat(adminFee || '0') / 100).toFixed(2)} split {advisorShare}/{platformShare}
                </p>
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>

              {isLocked && contract.contract_locked_at && (
                <p className="text-xs text-muted-foreground">
                  Locked on {new Date(contract.contract_locked_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              )}

              {/* Actions */}
              {!isLocked && (
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleSave(false)}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                    onClick={() => handleSave(true)}
                    disabled={isSaving}
                  >
                    <Lock className="w-4 h-4 mr-1.5" />
                    {isSaving ? 'Locking...' : 'Save & Lock'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
