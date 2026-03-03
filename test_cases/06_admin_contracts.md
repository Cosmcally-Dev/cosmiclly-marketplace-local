# Test Case: Admin Advisor Contracts/Deals

## Changes Made
- New migration: `20260304000000_advisor_contracts_and_stats.sql` adding contract columns to `advisor_details`
- New component: `AdvisorContractModal.tsx` for viewing/editing advisor contracts
- Updated `AdminUsersTable.tsx` — advisor rows are clickable, "Contract" column added
- Updated `AdminApplicationReview.tsx` — contract terms set before approval
- Updated `approve_advisor_application` RPC to accept contract parameters
- New RPC: `update_advisor_contract` (admin-only, respects lock)

## Prerequisites
- Migration `20260304000000_advisor_contracts_and_stats.sql` must be applied (`supabase db push`)
- User must be logged in as admin

## Verification Steps

### 1. Apply Migration
- [ ] Run `supabase db push`
- [ ] Verify migration applies without errors
- [ ] Verify `advisor_details` table has new columns: `advisor_share_percent`, `platform_share_percent`, `admin_fee_percent`, `contract_locked`, `contract_locked_at`, `contract_locked_by`

### 2. Admin Users Table
- [ ] Navigate to `/admin` → Users tab
- [ ] Verify advisor rows have a "Contract" column with a FileText icon
- [ ] Verify advisor rows have cursor-pointer styling (hoverable)
- [ ] Click on an advisor row → contract modal should open

### 3. Contract Modal — View/Edit
- [ ] Verify modal shows advisor name and email
- [ ] Verify default values: Advisor Share = 50%, Platform Share = 50%, Admin Fee = 5%
- [ ] Change Advisor Share to 60% → Platform Share should auto-update to 40%
- [ ] Change Platform Share to 70% → Advisor Share should auto-update to 30%
- [ ] Try setting invalid values (e.g., shares don't sum to 100) → should show validation error
- [ ] Click "Save Draft" → values should persist (close and reopen modal to verify)

### 4. Contract Lock
- [ ] Click "Save & Lock" → contract should become locked
- [ ] Close and reopen modal → fields should be **read-only**
- [ ] Lock date and status should be displayed
- [ ] Verify locked contracts cannot be edited

### 5. Advisor Application — Contract Terms Before Approval
- [ ] Navigate to Admin → Approvals tab
- [ ] Open a pending application
- [ ] Verify contract terms section appears (Advisor Share %, Platform Share %, Admin Fee %)
- [ ] Verify example calculation preview (e.g., "$100 session → $5 admin fee → $47.50 advisor / $47.50 platform")
- [ ] Try to approve without valid shares summing to 100 → should be prevented
- [ ] Approve with valid contract terms → advisor should be activated

### 6. Revenue Calculation Verification
- [ ] For an advisor with 60/40 split and 5% admin fee:
  - $100 session → $5 admin fee → $95 remaining → $57 advisor / $38 platform
- [ ] Verify this calculation appears correctly in the advisor's dashboard stats
