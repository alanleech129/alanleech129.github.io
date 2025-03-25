const FIVE_MINUTES_IN_MS = 300000

function normalise(input, now) {
    const nowIso8601Minutes = formatIsoMinutes(now)
    const output = {}
    for (let namespace of Object.keys(input)) {
        output[namespace] = normaliseNamespace(input[namespace], nowIso8601Minutes)
    }
    return output
}

function normaliseNamespace(input, now) {
    return fillInMissingTimestampsAsUnavailable(input, now)
}

function fillInMissingTimestampsAsUnavailable(input, now) {
    const output = {
        earliestFineGrainedData: input.earliestFineGrainedData,
        fineGrainedData: {...input.fineGrainedData}
    }

    const earliestDataExpected = output.earliestFineGrainedData
    const earliestDataActuallyAvailable = Object.keys(output.fineGrainedData).sort()[0]
    if (differenceInMs(earliestDataExpected, earliestDataActuallyAvailable) > FIVE_MINUTES_IN_MS) {
        // Data is missing from the start. Mark as 'unavailable' at the expected start time.
        output.fineGrainedData[earliestDataExpected] = 'unavailable'
    }

    const latestRequiredDataDate = new Date(now)
    latestRequiredDataDate.setMinutes(latestRequiredDataDate.getMinutes() - 10)
    const latestRequiredData = nextRound5Minutes(latestRequiredDataDate).toISOString().substring(0, 16)
    const mostRecentDataActuallyAvailable = Object.keys(output.fineGrainedData).sort().reverse()[0]

    if (differenceInMs(mostRecentDataActuallyAvailable, latestRequiredData) > 0) {
        // Data is missing from the end. Mark as 'unavailable' at the most recent time we can reasonably expect data.
        // That's the most recent round 5 minutes that's at least 5 minutes ago.
        // If it's 12:15, we can expect data up to at least 12:10, but no data at 12:15 isn't an error - it might just be late.
        // We won't mark the data at 12:15 missing until 12:20.
        output.fineGrainedData[latestRequiredData] = 'unavailable'
    }

    for (let i = 1; i < Object.keys(output.fineGrainedData).length; i++) {
        const availableTimestamps = Object.keys(output.fineGrainedData).sort()
        if (differenceInMs(availableTimestamps[i-1], availableTimestamps[i]) > FIVE_MINUTES_IN_MS) {
            const missingTimestamp = nextRound5Minutes(availableTimestamps[i-1])
            const formatted = formatIsoMinutes(missingTimestamp)
            output.fineGrainedData[formatted] = 'unavailable'
        }
    }

    return output
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
    return toMinutePrecision
}

export { normalise }

