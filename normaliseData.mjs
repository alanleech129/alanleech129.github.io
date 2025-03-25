const FIVE_MINUTES_IN_MS = 300000

function normalise(data, now) {
    const copyToNormalise = deepCopy(data)

    const nowIso8601Minutes = formatIsoMinutes(now)
    for (let namespace of Object.keys(copyToNormalise)) {
        normaliseNamespace(copyToNormalise[namespace], nowIso8601Minutes)
    }
    return copyToNormalise
}

function normaliseNamespace(data, now) {
    fillInMissingTimestampsAsUnavailable(data, now)
}

function fillInMissingTimestampsAsUnavailable(data, now) {
    const {earliestDataExpected, fineGrainedData} = data

    const earliestDataActuallyAvailable = Object.keys(fineGrainedData).sort()[0]
    if (differenceInMs(earliestDataExpected, earliestDataActuallyAvailable) > FIVE_MINUTES_IN_MS) {
        // Data is missing from the start. Mark as 'unavailable' at the expected start time.
        fineGrainedData[earliestDataExpected] = 'unavailable'
    }

    const latestRequiredDataDate = new Date(now)
    latestRequiredDataDate.setMinutes(latestRequiredDataDate.getMinutes() - 10)
    const latestRequiredData = nextRound5Minutes(latestRequiredDataDate).toISOString().substring(0, 16)
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

function deepCopy(input) {
    if (input instanceof Array) {
        return input.map(it => deepCopy(it))
    } else if (typeof input === 'object') {
        const output = {}
        for (let key in input) {
            output[key] = deepCopy(input[key])
        }
        return output
    } else {
        return input
    }
}

export { normalise }

