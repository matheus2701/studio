
import { getYear } from 'date-fns';

export const CURRENT_YEAR = getYear(new Date());

export const DEFAULT_YEARS_FOR_FILTER = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
export const DEFAULT_MONTHS_FOR_FILTER = Array.from({ length: 12 }, (_, i) => i); // 0-indexed for date-fns
