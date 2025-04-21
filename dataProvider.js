import { normalise } from './normaliseData.mjs'

const dataQueue = []

async function fetchData() {
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

fetchData()

export { onData }
