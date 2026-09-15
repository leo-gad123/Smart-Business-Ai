import React from 'react';
import { User, ShiftRegister, ShiftType } from '../types';

export interface ActiveShiftBadgeProps {
  currentUser?: User | null;
  currentShift?: ShiftRegister | null;
  allUsers?: User[];
  customShiftType?: ShiftType | string;
  className?: string;
}

/**
 * Normalizes any internal shift type key or custom label into 
 * standard Rwandan POS display shifts (Whole Day, Morning Shift, Afternoon Shift, Night Shift).
 */
export function formatShiftName(shiftType?: ShiftType | string | null): string {
  if (!shiftType) return 'Whole Day';

  const normalized = String(shiftType).trim().toUpperCase();

  switch (normalized) {
    case 'WHOLE_DAY':
    case 'WHOLE DAY':
      return 'Whole Day';
    case 'MORNING_SHIFT':
    case 'PART_TIME_MORNING':
    case 'MORNING':
      return 'Morning Shift';
    case 'AFTERNOON_SHIFT':
    case 'PART_TIME_EVENING':
    case 'AFTERNOON':
    case 'EVENING':
      return 'Afternoon Shift';
    case 'NIGHT_SHIFT':
    case 'NIGHT':
      return 'Night Shift';
    default:
      if (shiftType.includes('Whole')) return 'Whole Day';
      if (shiftType.includes('Morning')) return 'Morning Shift';
      if (shiftType.includes('Afternoon') || shiftType.includes('Evening')) return 'Afternoon Shift';
      if (shiftType.includes('Night')) return 'Night Shift';
      return shiftType;
  }
}

/**
 * Navbar Shift Badge Component
 * Dynamically fetches the assigned shift from the active employee's profile
 * created by the Owner in Employee Registration, replacing long shift codes.
 */
export const ActiveShiftBadge: React.FC<ActiveShiftBadgeProps> = ({
  currentUser,
  currentShift,
  allUsers = [],
  customShiftType,
  className = ''
}) => {
  // Dynamically resolve the active employee's assigned shift from their profile
  let rawShift: ShiftType | string | undefined = customShiftType;

  if (!rawShift) {
    // 1. Check if the active employee is currentUser
    if (currentUser?.shiftType) {
      rawShift = currentUser.shiftType;
    }

    // 2. Or look up the cashier assigned to the current shift from all registered users
    if (!rawShift && currentShift) {
      if (currentShift.shiftType) {
        rawShift = currentShift.shiftType;
      } else {
        const assignedEmployee = allUsers.find(
          (u) => u.id === currentShift.cashierId || u.name === currentShift.cashierName
        );
        if (assignedEmployee?.shiftType) {
          rawShift = assignedEmployee.shiftType;
        }
      }
    }

    // 3. Fallback to Whole Day if not specified
    if (!rawShift) {
      rawShift = 'WHOLE_DAY';
    }
  }

  const shiftTypeName = formatShiftName(rawShift);

  return (
    <div
      id="badge-navbar-active-shift"
      className={`flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 whitespace-nowrap ${className}`}
      title={`Active Employee Assigned Shift: ${shiftTypeName}`}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      <span>Shift: {shiftTypeName}</span>
    </div>
  );
};

export default ActiveShiftBadge;
