import { normalise } from './normaliseData.mjs'

const dataQueue = []
let fetchDataCallbackId
let expectedCallbackTime = 0

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

    const now = new Date().valueOf()
    expectedCallbackTime = now + plusTimeForGithubToBeUpdated

    if (fetchDataCallbackId) {
        clearTimeout(fetchDataCallbackId)
    }
    fetchDataCallbackId = setTimeout(() => fetchData(), plusTimeForGithubToBeUpdated)
}

function fetchDataIfStale() {
    const now = new Date().valueOf()
    if (now > expectedCallbackTime) {
        fetchData()
    }
}

fetchData()
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        fetchDataIfStale()
    }
})

export { onData }
