import { normalise } from './normaliseData.mjs'

const dataQueue = []

async function fetchData() {
    enqueueNextFetchCall()
    const response = await fetch('data.json', { cache: 'no-cache' })
    if (!response.ok) {
        throw new Error(response)
    }

    const data = normalise(await response.json(), new Date())
    dataQueue.forEach(it => it(data))
}

function onData(namespace, callback) {
    dataQueue.push(data => callback(data[namespace]))
}

function enqueueNextFetchCall() {
    const millisSinceLastRound5Minutes = new Date().valueOf() % 300000
    const timeToNextRound5Minutes = 300000 - millisSinceLastRound5Minutes
    const plusTimeForGithubToBeUpdated = timeToNextRound5Minutes + 60000

    setTimeout(() => fetchData(), plusTimeForGithubToBeUpdated)
}

fetchData()

export { onData }
