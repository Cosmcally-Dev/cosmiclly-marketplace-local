import { useState } from 'react';
import { useAdminReviews, type AdminReview } from '@/hooks/useAdminReviews';
import { useAdvisors } from '@/hooks/useAdvisors';
import { AdminReviewModal } from '@/components/admin/AdminReviewModal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ratingStars = (rating: number) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`w-4 h-4 ${
          s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-none text-muted-foreground/30'
        }`}
      />
    ))}
  </div>
);

export const AdminReviewsTable = () => {
  const [advisorFilter, setAdvisorFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const { reviews, isLoading, createReview, updateReview, deleteReview } = useAdminReviews(advisorFilter, sourceFilter);
  const { advisors } = useAdvisors();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editReview, setEditReview] = useState<AdminReview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreate = () => {
    setEditReview(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (review: AdminReview) => {
    setEditReview(review);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditReview(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteReview(deleteTarget.id);
      toast({ title: 'Review deleted' });
      setDeleteTarget(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Review
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <Select value={advisorFilter} onValueChange={setAdvisorFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by advisor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Advisors</SelectItem>
            {advisors.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="admin">Admin Created</SelectItem>
            <SelectItem value="user">User Created</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16">
          <Star className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-medium text-foreground mb-2">No Reviews Found</h3>
          <p className="text-muted-foreground text-sm">
            {advisorFilter !== 'all' || sourceFilter !== 'all'
              ? 'Try different filters.'
              : 'No reviews have been created yet.'}
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Advisor</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.advisor_name}</TableCell>
                  <TableCell className="font-medium">{r.client_name}</TableCell>
                  <TableCell>{ratingStars(r.rating)}</TableCell>
                  <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                    {r.review_text || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        r.is_admin_created
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                          : 'bg-green-500/20 text-green-500 border-green-500/30'
                      }
                    >
                      {r.is_admin_created ? 'Admin' : 'User'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {r.is_admin_created && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(r)}
                          aria-label="Edit review"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(r)}
                        aria-label="Delete review"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-3 border-t border-border text-xs text-muted-foreground text-center">
            Showing {reviews.length} reviews
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AdminReviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreateReview={createReview}
        onUpdateReview={updateReview}
        editReview={editReview}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Review"
        description={`Are you sure you want to delete this ${deleteTarget?.is_admin_created ? 'admin-created' : 'user'} review? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={isDeleting}
      />
    </div>
  );
};
