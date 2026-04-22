# Savings Goals Implementation Plan

This plan outlines the steps to add the "Savings Goals" (Metas de Ahorro) feature to FinTracker.

## User Review Required

- **Database Migration**: A new table `savings_goals` will be created via a Supabase SQL migration.
- **Transactions on Contribution**: When a user contributes to a goal, they can optionally choose to create a transaction (expense/transfer) to reflect the money leaving their "available" balance. I will implement a checkbox in the "Contribute" modal for this.
- **Circular vs Linear Progress**: I will use a custom SVG for an elegant circular progress bar in the Goal Card, or fallback to the Shadcn UI linear `Progress` if circular feels too large. The plan assumes a visually pleasing circular/linear combo depending on the card layout.

## Proposed Changes

### Database

#### [NEW] `supabase/migrations/<timestamp>_create_savings_goals.sql`
- Create `savings_goals` table:
  ```sql
  CREATE TABLE savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL,
    current_amount NUMERIC NOT NULL DEFAULT 0,
    deadline DATE,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
  -- Policies for SELECT, INSERT, UPDATE, DELETE
  ```

### Data Types & Actions

#### [MODIFY] `src/lib/data.ts`
- Add `SavingsGoal` type.
- Update `DashboardData` to include `topGoals: SavingsGoal[]`.
- Update `getDashboardData` to fetch the top 2 closest goals (ordered by `deadline` ASC where `current_amount < target_amount`).
- Create `getGoalsData` to fetch all goals for the user.

#### [MODIFY] `src/lib/actions.ts`
- Add `createGoal(data)` action.
- Add `updateGoal(id, data)` action.
- Add `contributeToGoal(goalId, amount, createTransaction, accountId)` action.

### Navigation & Localization

#### [MODIFY] `src/components/navbar.tsx`
- Add the `Target` icon and link to `/goals` in both Desktop and Mobile navigation under the label "Metas".

#### [MODIFY] `src/language/en.json` & `src/language/es.json`
- Add translations for the goals section (`navbar.goals`, `goals.title`, `goals.contribute`, `goals.achieved`, `goals.remaining`, etc.).

### User Interface - Goals Page

#### [NEW] `src/app/goals/page.tsx`
- Server component to fetch all goals using `getGoalsData` and render the shell.

#### [NEW] `src/components/goals/goals-shell.tsx`
- Main client layout for the goals page.

#### [NEW] `src/components/goals/goal-card.tsx`
- Elegant card displaying the goal icon, name, deadline, circular/linear progress, and a "Contribute" button. 

#### [NEW] `src/components/goals/goal-modal.tsx`
- Dialog to create or edit a goal.

#### [NEW] `src/components/goals/contribute-modal.tsx`
- Dialog to add funds to a goal. Includes an option to subtract from an account (creates a transaction).

### Dashboard Integration

#### [MODIFY] `src/components/dashboard/dashboard-shell.tsx`
- Integrate a "Top Goals" section next to the Category Donut chart or Month Stats. The UI will show the top 2 goals closest to their deadline.

## Verification Plan

### Automated Tests
- N/A

### Manual Verification
1. Run database migration and verify `savings_goals` table and RLS policies.
2. Navigate to Dashboard -> verify no breaking changes.
3. Open Navbar -> click "Metas" -> verify navigation to `/goals`.
4. Create a Goal -> check it appears in the grid.
5. Contribute to Goal -> check if amount increases, check if progress bar updates. Check if an expense transaction is created in the history when selected.
6. Verify Dashboard shows the closest goals.
