# Business Settings Feature

## Overview
Configure timezone and business hours to ensure accurate pace tracking calculations.

## Location
**Admin Panel → Business Settings Tab**
- URL: `http://localhost:3001/admin`
- Tab: "Business Settings" (Sliders icon)

## Features

### 1. Timezone Configuration
Select your organization's timezone:
- Eastern Time (ET)
- Central Time (CT)
- **Mountain Time (MT)** ← Default
- Mountain Time - Arizona (no DST)
- Pacific Time (PT)
- Alaska Time (AKT)
- Hawaii Time (HT)

### 2. Work Hours
Configure daily work schedule:
- **Start Time**: Default 8:00 AM
- **End Time**: Default 5:00 PM
- Used for daily pace calculations

### 3. Work Days
Select which days are work days:
- **Default**: Monday - Friday
- Click days to toggle on/off
- Used for weekly/monthly pace calculations

## Settings Storage
```
Firestore Collection: settings
Document ID: business
Fields:
  - timezone: string (e.g., "America/Denver")
  - workStartHour: number (0-23, e.g., 8)
  - workEndHour: number (0-23, e.g., 17)
  - workDays: number[] (0=Sunday, 1=Monday, etc.)
  - updatedAt: string (ISO timestamp)
  - updatedBy: string (admin user ID)
```

## API Endpoints

### GET /api/admin/settings
**Purpose**: Load business settings  
**Auth**: Admin only  
**Response**:
```json
{
  "settings": {
    "timezone": "America/Denver",
    "workStartHour": 8,
    "workEndHour": 17,
    "workDays": [1, 2, 3, 4, 5]
  }
}
```

### POST /api/admin/settings
**Purpose**: Save business settings  
**Auth**: Admin only  
**Body**:
```json
{
  "settings": {
    "timezone": "America/Denver",
    "workStartHour": 8,
    "workEndHour": 17,
    "workDays": [1, 2, 3, 4, 5]
  }
}
```

## Impact on Pace Tracking

### Daily Goals
- **Before**: Calculated pace over 24 hours
- **After**: Calculate pace over work hours only (e.g., 8 AM - 5 PM = 9 hours)
- **Example**: If it's 2 PM and you need 10 calls by 5 PM, pace shows "3.3 calls/hour needed"

### Weekly Goals
- **Before**: Calculated pace over 7 days
- **After**: Calculate pace over work days only (e.g., M-F = 5 days)
- **Example**: If it's Wednesday and you need 50 calls by Friday, pace shows "16.7 calls/day needed"

### Monthly Goals
- **Before**: Calculated pace over calendar days
- **After**: Calculate pace over work days only (e.g., ~22 work days/month)
- **Example**: More accurate daily targets based on actual work days remaining

## Next Steps (Implementation)

### 1. Update Pace Calculator
File: `lib/utils/paceCalculator.ts`

```typescript
// TODO: Load business settings
const settings = await getBusinessSettings();

// TODO: Calculate work hours remaining (not calendar hours)
const workHoursRemaining = calculateWorkHoursRemaining(
  now,
  periodEnd,
  settings.workStartHour,
  settings.workEndHour,
  settings.workDays
);

// TODO: Calculate work days remaining (not calendar days)
const workDaysRemaining = calculateWorkDaysRemaining(
  now,
  periodEnd,
  settings.workDays
);
```

### 2. Create Helper Functions
```typescript
// Calculate how many work hours remain in the period
function calculateWorkHoursRemaining(
  now: Date,
  end: Date,
  startHour: number,
  endHour: number,
  workDays: number[]
): number {
  // Implementation needed
}

// Calculate how many work days remain in the period
function calculateWorkDaysRemaining(
  now: Date,
  end: Date,
  workDays: number[]
): number {
  // Implementation needed
}
```

### 3. Update DailyPaceCard
File: `components/molecules/DailyPaceCard.tsx`

```typescript
// TODO: Pass business settings to calculatePace
const pace = calculatePace(
  goal.period,
  goal.target,
  currentProgress,
  new Date(),
  businessSettings // Add this parameter
);
```

## User Experience Changes

### What Users See
- **Dashboard**: Goals are read-only, managed by admin
- **No "Set New Goal" button**: Removed from Quick Actions
- **No "+ Add Goal" button**: Removed from My Active Goals section
- **Goals display only**: Users can view progress but not modify goals

### What Admins See
- **New "Business Settings" tab**: Configure org-wide settings
- **Team Goals tab**: Set goals for all users
- **Settings persist**: Saved in Firestore, applies to all users

## Benefits

1. **Accurate Pace Tracking**
   - Calculations based on actual work hours
   - No unrealistic targets during off-hours
   - Better daily/weekly planning

2. **Centralized Management**
   - Admins control all goals
   - Consistent goal structure across team
   - No user confusion about goal setting

3. **Timezone Awareness**
   - Correct date calculations for distributed teams
   - Accurate "today" vs "tomorrow" logic
   - Proper period boundaries

4. **Flexible Configuration**
   - Support different work schedules
   - Adjust for holidays (future feature)
   - Custom work hours per team (future feature)

## Example Scenarios

### Scenario 1: Daily Goal at 2 PM
**Settings**: 8 AM - 5 PM (9 work hours)  
**Goal**: 45 calls by end of day  
**Current**: 20 calls completed  
**Time**: 2:00 PM (6 hours worked, 3 hours remaining)  
**Pace**: Need 8.3 calls/hour (25 calls ÷ 3 hours)

### Scenario 2: Weekly Goal on Wednesday
**Settings**: Monday - Friday (5 work days)  
**Goal**: 200 calls by end of week  
**Current**: 80 calls completed  
**Day**: Wednesday (3 days worked, 2 days remaining)  
**Pace**: Need 60 calls/day (120 calls ÷ 2 days)

### Scenario 3: Monthly Goal on Oct 15
**Settings**: Monday - Friday  
**Goal**: $100,000 in sales by Oct 31  
**Current**: $45,000 completed  
**Date**: Oct 15 (11 work days worked, 11 work days remaining)  
**Pace**: Need $5,000/day ($55,000 ÷ 11 days)

## Testing Checklist

- [ ] Admin can access Business Settings tab
- [ ] Settings load with defaults (Mountain Time, 8-5, M-F)
- [ ] Timezone dropdown works
- [ ] Start/End time selectors work
- [ ] Work days toggle on/off
- [ ] Settings save successfully
- [ ] Settings persist after page refresh
- [ ] Non-admin users cannot access settings
- [ ] Dashboard shows read-only goals
- [ ] No goal management buttons visible to users
- [ ] Pace calculations use work hours (after implementation)

## Future Enhancements

1. **Holiday Calendar**
   - Skip holidays in pace calculations
   - Configurable holiday list
   - Automatic adjustment for company holidays

2. **Per-User Work Schedules**
   - Different hours for different roles
   - Part-time schedules
   - Flexible work arrangements

3. **Timezone Per User**
   - Support distributed teams
   - Individual timezone settings
   - Automatic conversion

4. **Break Time Configuration**
   - Exclude lunch breaks
   - Exclude meeting blocks
   - More accurate available work time
