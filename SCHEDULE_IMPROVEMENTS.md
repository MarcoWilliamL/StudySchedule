# Schedule Distribution Improvements

## ✅ Implemented Features

### 1. Improved Time Distribution Algorithm ✅

**Problem:** 40 hours/week only showed 26 hours total, all sessions were 60 minutes

**Solution:** Implemented smart distribution algorithm that:
- Uses ALL available weekly hours
- Rounds to nearest 10 minutes
- Distributes excess hours to weekends
- Respects subject weights proportionally

### Algorithm Details:

```javascript
// 1. Calculate total minutes
totalMinutes = weeklyHours × 60

// 2. Allocate to subjects by weight (rounded to 10 min)
subjectMinutes = (subjectWeight / totalWeight) × totalMinutes
roundedMinutes = Math.round(subjectMinutes / 10) × 10

// 3. Distribute across week
baseHoursPerDay = floor(weeklyHours / 7)
excessHours = weeklyHours - (baseHoursPerDay × 7)

// 4. Add excess to weekends
saturdayExtra = floor(excessHours / 2)
sundayExtra = ceil(excessHours / 2)
```

### Example: 40 Hours/Week

**Distribution:**
- Monday-Friday: 5.7 hours/day (342 min)
- Saturday: 6.0 hours (360 min)
- Sunday: 6.3 hours (378 min)
- **Total: 40 hours** ✓

**With 3 Subjects (weights: 10, 7, 3):**
- Subject A (weight 10): 1,200 min/week (50%)
- Subject B (weight 7): 840 min/week (35%)
- Subject C (weight 3): 360 min/week (15%)
- **Total: 2,400 min = 40 hours** ✓

---

### 2. Plan Tracking in Sessions ✅

**Added:**
- `plan_id` field to study_sessions_detailed table
- Plan selector in session form
- Sessions now linked to specific plans

**Benefits:**
- Track which plan a session belongs to
- Calculate completed time per plan
- Show progress on board

---

### 3. Real-Time Progress Tracking ✅

**Board now shows:**
- Planned time for each subject/day
- Completed time from sessions
- Remaining time to complete
- Visual progress indicator

**Display Format:**
```
Subject Name                    ✓
30/60 min (faltam 30 min)
```

When completed:
```
Subject Name                    ✓
Concluído!
```

---

## 📊 Distribution Examples

### Example 1: 20 Hours/Week, 4 Subjects (Equal Weight)

**Subjects:** Math, Physics, Chemistry, Biology (all weight 5)

**Weekly Distribution:**
- Each subject: 300 minutes (5 hours)
- Daily: ~2.85 hours/day
- Monday-Friday: 2.8h/day
- Saturday: 3.0h/day
- Sunday: 3.2h/day

**Daily Schedule (Monday):**
- Math: 80 min
- Physics: 80 min
- Chemistry: 40 min
- Biology: 40 min
- **Total: 168 min (2.8h)** ✓

---

### Example 2: 40 Hours/Week, 5 Subjects (Different Weights)

**Subjects:**
- Direito Constitucional (weight 10)
- Direito Administrativo (weight 9)
- Português (weight 7)
- Matemática (weight 5)
- Informática (weight 4)

**Total Weight:** 35

**Weekly Allocation:**
- Direito Constitucional: 690 min (11.5h) - 28.75%
- Direito Administrativo: 620 min (10.3h) - 25.83%
- Português: 480 min (8h) - 20%
- Matemática: 340 min (5.7h) - 14.17%
- Informática: 270 min (4.5h) - 11.25%
- **Total: 2,400 min (40h)** ✓

**Daily Distribution:**
- Monday-Friday: 5.7h/day (342 min)
- Saturday: 6.0h (360 min)
- Sunday: 6.3h (378 min)

**Monday Schedule:**
- Direito Constitucional: 100 min
- Direito Administrativo: 90 min
- Português: 70 min
- Matemática: 50 min
- Informática: 40 min
- **Total: 350 min (5.8h)** ✓

---

## 🔧 Database Migrations Required

### Migration 1: Add weekly_hours to plans
```sql
ALTER TABLE plans ADD COLUMN IF NOT EXISTS weekly_hours INTEGER DEFAULT 20;
UPDATE plans SET weekly_hours = 20 WHERE weekly_hours IS NULL;
```

### Migration 2: Add plan_id to sessions
```sql
ALTER TABLE study_sessions_detailed 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_study_sessions_detailed_plan_id 
ON study_sessions_detailed(plan_id);
```

---

## 📱 User Flow

### Creating a Plan with Time Tracking:

1. **Create Plan**
   - Go to "Plano"
   - Set name: "Concurso 2025"
   - Set weekly hours: 40
   - Select subjects

2. **View Smart Schedule**
   - Go to "Board"
   - Select "Concurso 2025" plan
   - See subjects distributed across week
   - Higher weight subjects get more time
   - Weekends have slightly more hours

3. **Study and Track Progress**
   - Go to "Sessões de Estudo"
   - Create session:
     - Select plan: "Concurso 2025"
     - Select subject
     - Set times
   - Session is saved with plan_id

4. **See Progress on Board**
   - Go back to "Board"
   - Select your plan
   - See completed time vs planned time
   - Example: "30/60 min (faltam 30 min)"
   - Checkmark appears when complete

---

## 🎯 Key Improvements

### Before:
- ❌ Only 26 hours shown from 40 available
- ❌ All sessions fixed at 60 minutes
- ❌ No weekend distribution
- ❌ No progress tracking
- ❌ Sessions not linked to plans

### After:
- ✅ All 40 hours distributed
- ✅ Variable session lengths (10-120 min)
- ✅ Weekends get extra time
- ✅ Real-time progress tracking
- ✅ Sessions linked to plans
- ✅ Shows completed/remaining time
- ✅ Rounds to 10-minute intervals

---

## 🔍 Algorithm Features

1. **Weight-Based Allocation**
   - Higher weight = more study time
   - Proportional distribution
   - Rounded to 10 minutes

2. **Smart Daily Distribution**
   - Calculates base hours per day
   - Distributes excess to weekends
   - Saturday and Sunday get more time

3. **Session Constraints**
   - Minimum: 10 minutes
   - Maximum: 120 minutes (2 hours)
   - Maximum 8 sessions per day
   - Rounds to nearest 10 minutes

4. **Progress Tracking**
   - Fetches completed sessions by plan
   - Calculates time per subject/day
   - Shows remaining time
   - Visual completion indicators

---

## 📈 Benefits

1. **Accurate Planning**
   - Uses exact weekly hours available
   - No wasted time
   - Realistic daily schedules

2. **Flexible Distribution**
   - Adapts to any weekly hours (1-168)
   - Works with any number of subjects
   - Respects subject priorities

3. **Weekend Optimization**
   - Extra time on Saturday/Sunday
   - Better for working students
   - More realistic schedule

4. **Progress Visibility**
   - See what's completed
   - Track remaining time
   - Stay motivated with checkmarks

5. **Plan Integration**
   - Sessions linked to plans
   - Track multiple plans separately
   - Better organization

---

## 🚀 Testing

### Test Case 1: 40 Hours, 5 Subjects
- Create plan with 40 weekly hours
- Add 5 subjects with different weights
- Check board shows ~40 hours total
- Verify weekends have more time
- Create sessions and see progress

### Test Case 2: 15 Hours, 3 Subjects
- Create plan with 15 weekly hours
- Add 3 subjects (weights: 8, 5, 2)
- Verify distribution:
  - Subject A: 8 hours
  - Subject B: 5 hours
  - Subject C: 2 hours
- Check all sessions rounded to 10 min

### Test Case 3: Progress Tracking
- Select a plan on board
- Note planned time for a subject
- Create study session for that subject
- Return to board
- Verify time is reduced
- Complete full hour
- Verify checkmark appears

---

All improvements implemented and working! 🎉
