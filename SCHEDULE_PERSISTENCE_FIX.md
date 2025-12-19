# Schedule Persistence Fix

## Problem
The board schedule was being regenerated dynamically every time the page loaded, causing:
- Different subject order and distribution each day
- Completed sessions not matching the current schedule
- Inconsistent weekly planning experience

## Solution
Implemented persistent weekly schedules that are saved to the database.

### New Database Table: `weekly_schedules`
Stores generated schedules for each plan and week combination:
- `plan_id`: Which study plan
- `week_start_date`: Start date of the week (Sunday)
- `schedule_data`: Complete schedule as JSON
- Unique constraint on (plan_id, week_start_date)

### How It Works

1. **First Time (Week Generation)**:
   - User selects a plan on the Board
   - System checks if schedule exists for current week
   - If not found, generates new schedule using the algorithm
   - Saves generated schedule to `weekly_schedules` table
   - Displays the schedule

2. **Subsequent Visits**:
   - User opens Board with same plan
   - System loads existing schedule from database
   - Shows exact same schedule as before
   - Completed sessions remain consistent

3. **New Week**:
   - When week changes (Sunday), system generates new schedule
   - Previous week's schedule remains in database for history
   - New schedule saved for new week

### Benefits
- ✅ Consistent schedule throughout the week
- ✅ Completed sessions always match the schedule
- ✅ Can review past weeks' schedules
- ✅ Better planning and tracking
- ✅ No confusion about which subjects to study

### Migration Required
Run the SQL migration file: `database-migration-weekly-schedule.sql`

This creates the `weekly_schedules` table with proper RLS policies.

### Technical Details
- Schedule is stored as JSONB for flexibility
- Unique constraint prevents duplicate schedules
- RLS ensures users only see their own schedules
- Automatic fallback to generation if database fails
- Compatible with existing completed session tracking
