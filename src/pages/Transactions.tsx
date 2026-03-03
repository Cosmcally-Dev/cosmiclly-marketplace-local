import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CreditCard, ArrowUpRight, ArrowDownRight,
  Clock, Hash, Filter,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/utils/formatters';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount_cents: number;
  credits: number;
  stripe_checkout_session_id: string | null;
  session_id: string | null;
  status: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

type TypeFilter = 'all' | 'purchase' | 'session_deduction' | 'ai_chat_deduction' | 'refund';

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'credit_purchase': return 'Credit Purchase';
    case 'session_deduction': return 'Session';
    case 'ai_chat_deduction': return 'AI Chat';
    case 'refund': return 'Refund';
    default: return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
};

const isCredit = (type: string) =>
  type === 'credit_purchase' || type === 'refund';

const Transactions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [user?.id]);

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return transactions;
    if (typeFilter === 'purchase') return transactions.filter(t => t.type === 'credit_purchase');
    return transactions.filter(t => t.type === typeFilter);
  }, [transactions, typeFilter]);

  const totalAdded = useMemo(
    () => transactions.filter(t => isCredit(t.type)).reduce((sum, t) => sum + t.credits, 0),
    [transactions]
  );

  const totalSpent = useMemo(
    () => transactions.filter(t => !isCredit(t.type)).reduce((sum, t) => sum + t.credits, 0),
    [transactions]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Transaction History</h1>
            <p className="text-muted-foreground">Track your credit purchases and usage</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Added</p>
                <p className="text-2xl font-bold text-green-500">{totalAdded.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-red-500">{totalSpent.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Hash className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-card border border-border">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className="w-[180px] bg-secondary border-border">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="purchase">Purchases</SelectItem>
                <SelectItem value="session_deduction">Sessions</SelectItem>
                <SelectItem value="ai_chat_deduction">AI Chat</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground ml-auto">
              Showing <span className="text-foreground font-medium">{filtered.length}</span> transactions
            </p>
          </div>

          {/* Transaction list */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="text-sm text-muted-foreground mt-4">Loading transactions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading font-medium text-foreground mb-2">No transactions found</h3>
              <p className="text-sm text-muted-foreground">
                Your credit purchases and usage will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((txn) => {
                const credit = isCredit(txn.type);
                return (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        credit ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {credit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{getTypeLabel(txn.type)}</p>
                          <Badge variant={txn.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            {txn.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(txn.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-semibold ${credit ? 'text-green-500' : 'text-red-500'}`}>
                        {credit ? '+' : '-'}{txn.credits.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">credits</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Transactions;
