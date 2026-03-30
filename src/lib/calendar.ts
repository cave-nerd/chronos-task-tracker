export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: Date | null;
  endTime: Date | null;
  isAllDay: boolean;
}

export function parseICalForToday(icalData: string): CalendarEvent[] {
  // 1. Unfold lines (iCal folds long lines with a space or tab on the next line)
  const unfolded = icalData.replace(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);
  
  const events: CalendarEvent[] = [];
  let currentEvent: Partial<CalendarEvent> | null = null;
  
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const tomorrowStart = todayStart + 86400000;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = { description: '', isAllDay: false };
      continue;
    }
    
    if (line === 'END:VEVENT' && currentEvent) {
      // Check if it's today
      let isToday = false;
      const start = currentEvent.startTime?.getTime() || 0;
      const end = currentEvent.endTime?.getTime() || start;
      
      // If the event overlaps with today, it belongs on today's list.
      // E.g., start < tomorrowStart AND end >= todayStart
      if (start < tomorrowStart && end >= todayStart) {
        isToday = true;
        // Specifically for all-day events that just have a start date
        if (currentEvent.isAllDay && start >= todayStart && start < tomorrowStart) {
           isToday = true;
        }
      }

      if (isToday && currentEvent.title) {
        currentEvent.id = currentEvent.id || crypto.randomUUID();
        events.push(currentEvent as CalendarEvent);
      }
      currentEvent = null;
      continue;
    }

    if (!currentEvent) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const fullKey = line.substring(0, colonIdx);
    const value = line.substring(colonIdx + 1);

    // Some keys have parameters separated by semicolons (e.g., DTSTART;TZID=America/New_York)
    const keyParts = fullKey.split(';');
    const key = keyParts[0];

    if (key === 'SUMMARY') {
      currentEvent.title = value.trim();
    } else if (key === 'DESCRIPTION') {
      // Replace escaped newlines with actual newlines
      currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').trim();
    } else if (key === 'UID') {
      currentEvent.id = value.trim();
    } else if (key === 'DTSTART' || key === 'DTEND') {
      const isAllDay = keyParts.includes('VALUE=DATE') || value.length === 8;
      const parsedDate = parseICalDate(value, isAllDay);
      
      if (key === 'DTSTART') {
        currentEvent.startTime = parsedDate;
        if (isAllDay) currentEvent.isAllDay = true;
      } else {
        currentEvent.endTime = parsedDate;
      }
    }
  }

  return events;
}

function parseICalDate(dateStr: string, isAllDay: boolean): Date | null {
  if (!dateStr) return null;

  // All day: YYYYMMDD
  if (isAllDay || dateStr.length === 8) {
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);
    return new Date(year, month, day);
  }

  // With Time: YYYYMMDDTHHMMSS (possibly ending with Z for UTC)
  const isUTC = dateStr.endsWith('Z');
  const cleanStr = dateStr.replace('Z', '');
  
  if (cleanStr.length !== 15) return null; // Format strictly YYYYMMDDTHHMMSS
  
  const year = parseInt(cleanStr.substring(0, 4), 10);
  const month = parseInt(cleanStr.substring(4, 6), 10) - 1;
  const day = parseInt(cleanStr.substring(6, 8), 10);
  const hour = parseInt(cleanStr.substring(9, 11), 10);
  const min = parseInt(cleanStr.substring(11, 13), 10);
  const sec = parseInt(cleanStr.substring(13, 15), 10);

  if (isUTC) {
    return new Date(Date.UTC(year, month, day, hour, min, sec));
  } else {
    // Treat as local time or specifically ignore TZ shifts for simplicity 
    // (A true robust parser would read the VTIMEZONE block, but this is generally sufficient for local apps)
    return new Date(year, month, day, hour, min, sec);
  }
}
