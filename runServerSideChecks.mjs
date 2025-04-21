#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { normalise } from './normaliseData.mjs'
import statusChecker from './statusProviders/statusChecker.mjs'

async function readCurrentDataFile() {
    try {
        const content = await readFile('data.json', { encoding: 'utf8' })
        return JSON.parse(content)
    } catch (error) {
        if (error?.code === 'ENOENT') {
            return {}
        } else {
            throw error
        }
    }
}

async function getStatuses() {
    const statuses = await Promise.all([
        statusChecker(),
    ])

    const output = {}
    for (let {name, status} of statuses) {
        output[name] = status
    }

    return output
}

function combineData(existingData, newData, nowUnformatted) {
    const combined = {...existingData}

    const now = nowUnformatted.toISOString().substring(0, 16) + 'Z'
    for (let namespace in newData) {
        combined[namespace] = combineDataForNamespace(combined[namespace], newData[namespace], now)
    }

    return combined
}

function combineDataForNamespace(existingDataOrUndefined, newAvailability, now) {
    const fineGrainedData = {...existingDataOrUndefined?.fineGrainedData}
    fineGrainedData[now] = newAvailability

    return {
        ...existingDataOrUndefined,
        fineGrainedData,
    }
}

async function writeDataFile(data) {
    const formattedJson = JSON.stringify(data, null, 4)
    await writeFile('data.json', formattedJson, { encoding: 'utf8' })
}

async function run() {
    const existingData = await readCurrentDataFile()
    const newData = await getStatuses()

    const now = new Date()
    const combinedData = combineData(existingData, newData, now)
    const normalisedData = normalise(combinedData, now)

    await writeDataFile(normalisedData)
}

await run()
