export interface PlayEvent {
  time: number;
  event: string;
}

export interface ProcessedEvent {
  time: number;
  event: string;
}

export function processPlayData(playData: PlayEvent[]): ProcessedEvent[] {
  const seenEvents = new Set<string>(); // Track seen event-time pairs
  const processedData: ProcessedEvent[] = [];

  playData.forEach(event => {
      const formattedTime = Math.floor(event.time); // Use Math.floor to remove everything after the decimal point
      const eventTimeKey = `${formattedTime}-${event.event}`; // Create a unique key for the event-time pair

      if (!seenEvents.has(eventTimeKey)) {
          processedData.push({
              time: formattedTime,
              event: event.event
          });
          seenEvents.add(eventTimeKey);
      }
  });

  return processedData;
}
