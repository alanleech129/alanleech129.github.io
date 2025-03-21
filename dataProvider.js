let dataAvailable = false
let data = undefined
const dataQueue = []

async function fetchData() {
    const response = await fetch('data.json', { cache: 'no-cache' })
    if (!response.ok) {
        throw new Error(response)
    }
    data = await response.json()
    dataAvailable = true
    dataQueue.forEach(it => it(data))
}

async function getData(name) {
    if (dataAvailable) {
        return fillInMissingData(data[name])
    } else {
        return new Promise((resolve, reject) => {
            dataQueue.push(data => resolve(fillInMissingData(data[name])))
        })
    }
}

function fillInMissingData(partialData) {
    const FIVE_MINUTES = 300000

    let data = {...partialData}
    const earliestDate = Object.keys(data).sort()[0]

    for (let i = 1; i < Object.keys(data).length; i++) {
        const dates = Object.keys(data).sort()
        if (differenceInMs(dates[i-1], dates[i]) > FIVE_MINUTES) {
            const missingDate = nextRound5Minutes(dates[i-1])
            const formatted = formatIsoMinutes(missingDate)
            data[formatted] = 'unavailable'
        }
    }

    // cutoff is between 10 and 15 minutes ago.
    // Expect to have data from 10 minutes ago; if not, the status was 'unavailable'.
    // Data from 5 minutes ago might not be availble yet.
    // Cutoff should be between 5 and 10, but there's an off by 1 error (off by 5 error!?)
    const cutoff = new Date()
    cutoff.setMinutes(cutoff.getMinutes() - (cutoff.getMinutes() % 5) - 10)

    console.log('cutoff:', cutoff)
    for (let latestDate = extractLatestDate(data); latestDate < cutoff; latestDate = extractLatestDate(data)) {
        const nextDate = nextRound5Minutes(latestDate)
        const formatted = formatIsoMinutes(nextDate)
        data[formatted] = 'unavailable'
    }

    return data
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

function extractLatestDate(data) {
    const allDates = Object.keys(data)
    const reverseSorted = allDates.sort().reverse()
    console.log('latestDate:', new Date(reverseSorted[0]))
    return new Date(reverseSorted[0])
}

fetchData()

export { getData }
