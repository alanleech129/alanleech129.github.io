#!/usr/bin/env python3

from datetime import datetime, timezone
import json


def nowIso8601():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ")


def readCurrentData():
    with open('data.json', 'r', encoding='utf-8') as f:
        return json.loads(f.read())


def getStatuses():
    return {
        'foo': 'available',
        'bar': 'available'
    }


def combineData(currentData, newData):
    now = nowIso8601()
    for name, availability in newData.items():
        if name in currentData:
            currentData[name][now] = availability
        else:
            currentData[name] = {now: availability}

    return currentData


def writeDataFile(combinedData):
    with open('data.json', 'w', encoding = 'utf-8') as f:
        json.dump(combinedData, f)


currentData = readCurrentData()

newData = getStatuses()
combined = combineData(currentData, newData)

writeDataFile(combined)
