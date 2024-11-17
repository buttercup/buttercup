import { DateString, UTCTimestamp } from "../types.js";

export function getDateFromDateString(dateString: DateString): Date {
    return new Date(dateString);
}

export function getDateString(date: Date = new Date()): DateString {
    return date.toISOString();
}

export function getTimestamp(date: Date = new Date()): UTCTimestamp {
    return date.getTime();
}
