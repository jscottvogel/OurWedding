import { subDays } from 'date-fns';
import type { Schema } from '../../../amplify/data/resource';

type ChecklistCategory = Schema['ChecklistItem']['type']['category'];

interface DefaultTaskTemplate {
  category: ChecklistCategory;
  title: string;
  description?: string;
  daysBeforeWedding: number;
  sortOrder: number;
}

export const DEFAULT_TASKS: DefaultTaskTemplate[] = [
  // 12 Months Out
  { category: 'TWELVE_MONTHS', title: 'Set your overall wedding budget', daysBeforeWedding: 365, sortOrder: 10 },
  { category: 'TWELVE_MONTHS', title: 'Draft your initial guest list', daysBeforeWedding: 350, sortOrder: 20 },
  { category: 'TWELVE_MONTHS', title: 'Book a wedding venue', daysBeforeWedding: 330, sortOrder: 30 },
  { category: 'TWELVE_MONTHS', title: 'Hire a wedding planner (optional)', daysBeforeWedding: 320, sortOrder: 40 },
  { category: 'TWELVE_MONTHS', title: 'Book a photographer & videographer', daysBeforeWedding: 300, sortOrder: 50 },
  { category: 'TWELVE_MONTHS', title: 'Find an officiant', daysBeforeWedding: 280, sortOrder: 60 },

  // 6 Months Out
  { category: 'SIX_MONTHS', title: 'Order wedding attire (dress/suit)', daysBeforeWedding: 180, sortOrder: 100 },
  { category: 'SIX_MONTHS', title: 'Book caterer and schedule tastings', daysBeforeWedding: 170, sortOrder: 110 },
  { category: 'SIX_MONTHS', title: 'Book hotel blocks for out-of-town guests', daysBeforeWedding: 165, sortOrder: 115 },
  { category: 'SIX_MONTHS', title: 'Book transportation (shuttles, limo)', daysBeforeWedding: 165, sortOrder: 116 },
  { category: 'SIX_MONTHS', title: 'Send Save the Dates', daysBeforeWedding: 160, sortOrder: 120 },
  { category: 'SIX_MONTHS', title: 'Book florist and design decor', daysBeforeWedding: 150, sortOrder: 130 },
  { category: 'SIX_MONTHS', title: 'Book entertainment/DJ/Band', daysBeforeWedding: 140, sortOrder: 140 },

  // 3 Months Out
  { category: 'THREE_MONTHS', title: 'Start dance lessons for First Dance', description: 'Include parent dances or any other traditional dances.', daysBeforeWedding: 100, sortOrder: 190 },
  { category: 'THREE_MONTHS', title: 'Send official wedding invitations', daysBeforeWedding: 90, sortOrder: 200 },
  { category: 'THREE_MONTHS', title: 'Finalize menu and bar packages', daysBeforeWedding: 85, sortOrder: 210 },
  { category: 'THREE_MONTHS', title: 'Order wedding favors', daysBeforeWedding: 80, sortOrder: 215 },
  { category: 'THREE_MONTHS', title: 'Order wedding rings', daysBeforeWedding: 80, sortOrder: 220 },
  { category: 'THREE_MONTHS', title: 'Schedule dress/suit alterations', daysBeforeWedding: 70, sortOrder: 225 },
  { category: 'THREE_MONTHS', title: 'Finalize hair and makeup trial', daysBeforeWedding: 75, sortOrder: 230 },

  // 1 Month Out
  { category: 'ONE_MONTH', title: 'Apply for marriage license', daysBeforeWedding: 30, sortOrder: 300 },
  { category: 'ONE_MONTH', title: 'Write your wedding vows', daysBeforeWedding: 28, sortOrder: 305 },
  { category: 'ONE_MONTH', title: 'Final dress/suit fittings', daysBeforeWedding: 25, sortOrder: 310 },
  { category: 'ONE_MONTH', title: 'Purchase wedding party gifts', daysBeforeWedding: 20, sortOrder: 315 },
  { category: 'ONE_MONTH', title: 'Finalize seating chart', daysBeforeWedding: 20, sortOrder: 320 },
  { category: 'ONE_MONTH', title: 'Finalize music playlists (must-plays, do-not-plays)', daysBeforeWedding: 18, sortOrder: 325 },
  { category: 'ONE_MONTH', title: 'Confirm final headcount with venue/caterer', daysBeforeWedding: 18, sortOrder: 330 },

  // 2 Weeks Out
  { category: 'TWO_WEEKS', title: 'Final run-through with photographer/DJ', daysBeforeWedding: 14, sortOrder: 400 },
  { category: 'TWO_WEEKS', title: 'Break in your wedding shoes', daysBeforeWedding: 12, sortOrder: 410 },
  { category: 'TWO_WEEKS', title: 'Get final haircut/color', daysBeforeWedding: 10, sortOrder: 420 },

  // 1 Week Out
  { category: 'ONE_WEEK', title: 'Pack for honeymoon', daysBeforeWedding: 7, sortOrder: 500 },
  { category: 'ONE_WEEK', title: 'Confirm all vendor arrival times', daysBeforeWedding: 5, sortOrder: 510 },
  { category: 'ONE_WEEK', title: 'Final venue walkthrough', daysBeforeWedding: 4, sortOrder: 520 },

  // Day Before
  { category: 'DAY_BEFORE', title: 'Manicure/Pedicure', daysBeforeWedding: 1, sortOrder: 600 },
  { category: 'DAY_BEFORE', title: 'Rehearsal dinner', daysBeforeWedding: 1, sortOrder: 610 },
  { category: 'DAY_BEFORE', title: 'Give rings to Best Man/Maid of Honor', daysBeforeWedding: 1, sortOrder: 620 },

  // Day Of
  { category: 'DAY_OF', title: 'Eat a good breakfast!', daysBeforeWedding: 0, sortOrder: 700 },
  { category: 'DAY_OF', title: 'Get married!', daysBeforeWedding: 0, sortOrder: 710 },
];

export function generateDefaultChecklist(weddingId: string, weddingDateString: string) {
  const weddingDate = new Date(weddingDateString);

  return DEFAULT_TASKS.map((task) => {
    // Calculate due date by subtracting days from the wedding date
    const calculatedDate = subDays(weddingDate, task.daysBeforeWedding);
    
    return {
      weddingId,
      category: task.category,
      title: task.title,
      description: task.description || null,
      isTemplate: true,
      isCompleted: false,
      sortOrder: task.sortOrder,
      dueDate: calculatedDate.toISOString().split('T')[0], // YYYY-MM-DD
    };
  });
}
