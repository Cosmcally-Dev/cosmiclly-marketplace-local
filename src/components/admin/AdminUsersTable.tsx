import { useState } from 'react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { AdvisorContractModal } from './AdvisorContractModal';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users, FileText } from 'lucide-react';

interface SelectedUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

export const AdminUsersTable = () => {
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { users, isLoading } = useAdminUsers(roleFilter, debouncedSearch);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

  // Simple debounce for search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    clearTimeout((window as any).__adminUserSearchTimeout);
    (window as any).__adminUserSearchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">Admin</Badge>;
      case 'advisor':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Advisor</Badge>;
      case 'client':
        return <Badge variant="outline">Client</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const handleRowClick = (u: typeof users[number]) => {
    if (u.role === 'advisor') {
      setSelectedUser({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
      });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Users</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
            <SelectItem value="advisor">Advisors</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-medium text-foreground mb-2">No Users Found</h3>
          <p className="text-muted-foreground text-sm">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-center">Contract</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.id}
                  className={u.role === 'advisor' ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => handleRowClick(u)}
                >
                  <TableCell className="font-medium">{u.full_name || u.username || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">${u.credits.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    {u.role === 'advisor' ? (
                      <FileText className="w-4 h-4 mx-auto text-primary cursor-pointer" />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-3 border-t border-border text-xs text-muted-foreground text-center">
            Showing {users.length} users
          </div>
        </div>
      )}

      <AdvisorContractModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};
