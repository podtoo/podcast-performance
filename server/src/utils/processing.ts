export interface PlayEvent {
    time: number;
    event: string;
  }
  
  export interface ProcessedEvent {
    current: number;
    event: string;
  }
  
  export function processPlayData(playData: PlayEvent[]): ProcessedEvent[] {
    const seenTimes = new Set<number>();
    const processedData: ProcessedEvent[] = [];
  
    playData.forEach(event => {
      const formattedTime = Math.floor(event.time); // Use Math.floor to remove everything after the decimal point
  
      // Check if the current event is different from the last recorded event at the same time
      if (!seenTimes.has(formattedTime) || (processedData.length > 0 && processedData[processedData.length - 1].event !== event.event)) {
        processedData.push({
          current: formattedTime,
          event: event.event
        });
        seenTimes.add(formattedTime);
      }
    });
  
    return processedData;
  }
  