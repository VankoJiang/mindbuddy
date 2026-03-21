export interface NoteSummary {
  title: string;
  content: string;
  keywords: string[];
}

export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  calendar?: string;
}

export interface ScreenTimeData {
  totalHours: number;
  isLateNight: boolean;
  topApps: { name: string; hours: number }[];
}

export interface Context {
  notes: NoteSummary[];
  calendar: CalendarEvent[];
  screenTime: ScreenTimeData;
}
