"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPlayData = void 0;
function processPlayData(playData) {
    const seenEvents = new Set(); // Track seen event-time pairs
    const processedData = [];
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
exports.processPlayData = processPlayData;
