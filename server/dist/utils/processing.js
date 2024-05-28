"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPlayData = void 0;
function processPlayData(playData) {
    const seenTimes = new Set();
    const processedData = [];
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
exports.processPlayData = processPlayData;
