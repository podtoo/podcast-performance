import moment from 'moment-timezone';

// Function to get the current date/time in the specified timezone
function getCurrentTimeInTimezone(timezone: string) {
    return moment().tz(timezone).format();
}

export {getCurrentTimeInTimezone}