const FIVE_MINUTES_IN_MS = 300000

function normalise(data, now) {
    const normalisedData = {}

    const nowIso8601Minutes = formatIsoMinutes(now)
    for (let namespace of Object.keys(data)) {
        normalisedData[namespace] = processNamespace(data[namespace], nowIso8601Minutes)
    }

    return normalisedData
}

function processNamespace(data, now) {
    const normalised = normaliseNamespace(data, now)
    const withOldDataDeleted = deleteOldData(normalised, now)
    return withOldDataDeleted
}

function normaliseNamespace(data, now) {
    const fineGrainedData = fillInMissingTimestampsAsUnavailable(data, now)

    const withFilledInData = { ...data, fineGrainedData }

    const measurementLengths = timeBetweenMeasurements(withFilledInData)
    const summarisedByHour = summariseByHour(withFilledInData, measurementLengths, now)
    const summarisedByDate = summariseByDate(withFilledInData, measurementLengths, now)

    return {
        ...data,
        fineGrainedData,
        summarisedByHour,
        summarisedByDate,
    }
}

function fillInMissingTimestampsAsUnavailable(data, now) {
    const fineGrainedData = data.fineGrainedData

    const latestRequiredDataDate = new Date(now)
    latestRequiredDataDate.setMinutes(latestRequiredDataDate.getMinutes() - 10)
    const latestRequiredData = formatIsoMinutes(nextRound5Minutes(latestRequiredDataDate))
    const mostRecentDataActuallyAvailable = Object.keys(fineGrainedData).sort().reverse()[0]

    if (differenceInMs(mostRecentDataActuallyAvailable, latestRequiredData) > 0) {
        // Data is missing from the end. Mark as 'unavailable' at the most recent time we can reasonably expect data.
        // That's the most recent round 5 minutes that's at least 5 minutes ago.
        // If it's 12:15, we can expect data up to at least 12:10, but no data at 12:15 isn't an error - it might just be late.
        // We won't mark the data at 12:15 missing until 12:20.
        fineGrainedData[latestRequiredData] = 'unavailable'
    }

    for (let i = 1; i < Object.keys(fineGrainedData).length; i++) {
        const availableTimestamps = Object.keys(fineGrainedData).sort()
        if (differenceInMs(availableTimestamps[i-1], availableTimestamps[i]) > FIVE_MINUTES_IN_MS) {
            const missingTimestamp = nextRound5Minutes(availableTimestamps[i-1])
            const formatted = formatIsoMinutes(missingTimestamp)
            fineGrainedData[formatted] = 'unavailable'
        }
    }

    return fineGrainedData
}

function summariseByHour(data, measurementLengths, now) {
    const summarisedByHour = {...data.summarisedByHour}

    // 2025-01-02T03:04 -> 2025-01-02T03
    const thisHour = now.split(':')[0]

    const hoursWithFinegrainedData = new Set(Object.keys(data.fineGrainedData).map(it => it.split(':')[0]))
    Array.from(hoursWithFinegrainedData)
        .filter(datetime => datetime !== thisHour)
        .filter(datetime => !summarisedByHour[datetime + ':00Z'])
        .forEach(datetime => {
            const uptimeMs = uptime(data, measurementLengths, datetime)
            summarisedByHour[datetime + ':00Z'] = { uptime: uptimeMs / 3600000 }
        })

    return summarisedByHour
}

function summariseByDate(data, measurementLengths, now) {
    const summarisedByDate = {...data.summarisedByDate}
    const today = now.split('T')[0]

    const datesWithFineGrainedData = new Set(Object.keys(data.fineGrainedData).map(it => it.split('T')[0]))
    Array.from(datesWithFineGrainedData)
        .filter(date => date !== today)
        .filter(date => !summarisedByDate[date])
        .forEach(date => {
            const uptimeMs = uptime(data, measurementLengths, date)
            summarisedByDate[date] = { uptime: uptimeMs / 86400000 }
        })

    return summarisedByDate
}

function deleteOldData(data, now) {
    const fineGrainedCutoffDate = new Date(now)
    fineGrainedCutoffDate.setHours(fineGrainedCutoffDate.getHours() - 25)
    const fineGrainedCutoff = fineGrainedCutoffDate.toISOString()

    const hourlyCutoffDate = new Date(now)
    hourlyCutoffDate.setHours(hourlyCutoffDate.getHours() - 25)
    const hourlyCutoff = hourlyCutoffDate.toISOString()

    const dailyCutoffDate = new Date(now)
    dailyCutoffDate.setDate(dailyCutoffDate.getDate() - 25)
    const dailyCutoff = dailyCutoffDate.toISOString()

    const fineGrainedData = filterObjectByKeys(data.fineGrainedData, timestamp => timestamp > fineGrainedCutoff)
    const summarisedByHour = filterObjectByKeys(data.summarisedByHour, timestamp => timestamp > hourlyCutoff)
    const summarisedByDate = filterObjectByKeys(data.summarisedByDate, timestamp => timestamp > dailyCutoff)

    return {
        ...data,
        fineGrainedData,
        summarisedByHour,
        summarisedByDate,
    }
}

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
    return Object.keys(data.fineGrainedData)
        .filter(timestamp => timestamp.startsWith(timestampPrefix))
        .filter(timestamp => data.fineGrainedData[timestamp] === 'available')
        .map(timestamp => measurementLengths[timestamp].lengthInMs)
        .reduce((acc, value) => acc + value, 0)
}

function timeBetweenMeasurements(data) {
    const timestamps = Object.keys(data.fineGrainedData).sort()
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

function filterObjectByKeys(obj, predicate) {
    const filtered = {}
    Object.keys(obj).filter(predicate).forEach(key => filtered[key] = obj[key])
    return filtered
}

export { normalise }

