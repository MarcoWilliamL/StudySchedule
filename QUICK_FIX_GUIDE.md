# Quick Fix Guide

## Issue 1: Database Error - weekly_hours column missing ❌

**Error:** `Could not find the 'weekly_hours' column of 'plans' in the schema cache`

### Solution:

1. Go to your Supabase project
2. Open **SQL Editor**
3. Copy and paste this SQL:

```sql
-- Add weekly_hours column to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS weekly_hours INTEGER DEFAULT 20;

-- Update existing plans to have default value
UPDATE plans SET weekly_hours = 20 WHERE weekly_hours IS NULL;
```

4. Click **Run** or press `Ctrl+Enter`
5. You should see: "Success. No rows returned"

**That's it!** The column is now added and all existing plans have 20 hours by default.

---

## Issue 2: Chronometer Logic Fixed ✅

### Problem:
- Timer started at 04:00 (the session duration)
- Timer counted UP from 04:00 → 04:01 → 04:02...
- No alert when time finished

### Solution Applied:
- Timer now starts at **00:00**
- Counts UP to the session duration (00:00 → 00:01 → ... → 04:00)
- Shows remaining time
- **Alert appears** when timer reaches the target time
- Timer stops automatically
- Visual feedback (turns green when complete)

### How It Works Now:

**Example:** Session from 18:00 to 18:04 (4 minutes)

1. Create session with start=18:00, end=18:04
2. Modal appears
3. Timer shows: **00:00**
4. Timer counts: 00:01, 00:02, 00:03, 00:04
5. At **00:04** (4 minutes):
   - ⏰ Alert: "Tempo da sessão concluído!"
   - Timer turns green
   - Shows "✓ Sessão concluída!"
   - Timer stops automatically

### Modal Display:

```
⏱️ Sessão Registrada!

    00:02:30        ← Current time (blue)
    
    Tempo decorrido
    Meta: 00:04:00  ← Target time
    Faltam: 00:01:30 ← Remaining time
    
    [⏸️ Pausar] [✓ Fechar]
```

When complete:
```
⏱️ Sessão Registrada!

    00:04:00        ← Completed (green)
    
    ✓ Sessão concluída!
    Meta: 00:04:00
    
    [▶️ Continuar] [✓ Fechar]
```

---

## Testing the Fixes

### Test 1: Create a Plan
1. Go to "Plano"
2. Click "+ Novo Plano"
3. Fill in name, description
4. Set weekly hours (e.g., 25)
5. Select subjects
6. Click "Criar Plano"
7. ✅ Should work without errors

### Test 2: Chronometer
1. Go to "Sessões de Estudo"
2. Click "+ Nova Sessão"
3. Set start time: 10:00
4. Set end time: 10:05 (5 minutes)
5. Fill other fields
6. Click "Criar Sessão"
7. ✅ Modal appears with timer at 00:00
8. ✅ Timer counts: 00:01, 00:02, 00:03...
9. ✅ Shows "Faltam: 00:04:XX"
10. ✅ At 00:05:00 → Alert appears!
11. ✅ Timer turns green
12. ✅ Shows "✓ Sessão concluída!"

---

## Summary

✅ **Database:** Run the SQL migration to add weekly_hours column
✅ **Chronometer:** Fixed to start at 00:00 and count up
✅ **Alert:** Appears when timer reaches target time
✅ **Visual:** Green color and checkmark when complete
✅ **Auto-stop:** Timer stops automatically at target

All issues resolved! 🎉
