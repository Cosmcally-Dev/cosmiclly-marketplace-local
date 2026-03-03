import { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface TransactionRow {
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
  user: { full_name: string | null; email: string | null } | null;
}

type TypeFilter = 'all' | 'credit_purchase' | 'session_deduction' | 'ai_chat_deduction' | 'refund';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'credit_purchase': return 'Purchase';
    case 'session_deduction': return 'Session';
    case 'ai_chat_deduction': return 'AI Chat';
    case 'refund': return 'Refund';
    default: return type.replace(/_/g, ' ');
  }
};

const isCredit = (type: string) => type === 'credit_purchase' || type === 'refund';

export const AdminTransactionsTable = () => {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, user:profiles!user_id(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!error && data) {
        setTransactions(data as TransactionRow[]);
      }
      setIsLoading(false);
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    let result = transactions;
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        (t.user?.full_name || '').toLowerCase().includes(q) ||
        (t.user?.email || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [transactions, typeFilter, searchQuery]);

  const totalCreditsIn = useMemo(
    () => filtered.filter(t => isCredit(t.type)).reduce((s, t) => s + t.credits, 0),
    [filtered]
  );
  const totalCreditsOut = useMemo(
    () => filtered.filter(t => !isCredit(t.type)).reduce((s, t) => s + t.credits, 0),
    [filtered]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Transactions</h2>
          <p className="text-sm text-muted-foreground">All credit movements across the platform</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-green-500 font-semibold">+{totalCreditsIn.toFixed(2)} in</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-red-500 font-semibold">-{totalCreditsOut.toFixed(2)} out</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="credit_purchase">Purchases</SelectItem>
            <SelectItem value="session_deduction">Sessions</SelectItem>
            <SelectItem value="ai_chat_deduction">AI Chat</SelectItem>
            <SelectItem value="refund">Refunds</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} records</span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No transactions found.</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Credits</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((txn) => {
                const credit = isCredit(txn.type);
                return (
                  <tr key={txn.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(txn.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground font-medium">{txn.user?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{txn.user?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {credit
                          ? <ArrowUpRight className="w-4 h-4 text-green-500" />
                          : <ArrowDownRight className="w-4 h-4 text-red-500" />
                        }
                        <span className="text-foreground">{getTypeLabel(txn.type)}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${credit ? 'text-green-500' : 'text-red-500'}`}>
                      {credit ? '+' : '-'}{txn.credits.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={txn.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {txn.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
