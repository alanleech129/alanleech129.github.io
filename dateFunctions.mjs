/**
 * Calculate the uptime in milliseconds for a given timestamp prefix
 *
 * timestamp prefix: an ISO 8601 datetime with a lower precision then is found in `data` (and `measurementLengths`, which has the same keys).
 * `data` is to minute precision: 2000-01-01T12:34
 * If the prefix is a date (2000-01-01) then we'll calculate uptime for the day.
 * If the prefix is to hour precision (2000-01-01T12) then it's for the hour.
 *
 * ISO 8601 datetimes to hour precision are perfectly valid, just unusual!
 */
function uptime(data, measurementLengths, timestampPrefix) {
    return Object.keys(data)
        .filter(timestamp => timestamp.startsWith(timestampPrefix))
        .filter(timestamp => data[timestamp] === 'available')
        .map(timestamp => measurementLengths[timestamp].lengthInMs)
        .reduce((acc, value) => acc + value, 0)
}

function timeBetweenMeasurements(data) {
    const timestamps = Object.keys(data).sort()
    const measurementLengths = {}
    for (let i = 0; i < timestamps.length - 1; i++) {
        const thisTs = timestamps[i]
        const nextTs = timestamps[i+1]
        measurementLengths[thisTs] = { lengthInMs: differenceInMs(thisTs, nextTs) }
    }
    return measurementLengths
}

function nextRound5Minutes(input) {
    const date = new Date(input)
    const minutes = date.getMinutes()
    const ceil5Minutes = minutes - (minutes % 5) + 5
    date.setMinutes(ceil5Minutes)
    date.setSeconds(0)
    date.setMilliseconds(0)
    return date
}

function differenceInMs(date1, date2) {
    return new Date(date2).valueOf() - new Date(date1).valueOf()
}

function formatIsoMinutes(date) {
    const iso8601Datetime = date.toISOString()
    const toMinutePrecision = iso8601Datetime.substring(0, 16)
    return toMinutePrecision + 'Z'
}

export { uptime, timeBetweenMeasurements, nextRound5Minutes, differenceInMs, formatIsoMinutes }
