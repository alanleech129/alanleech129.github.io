import element from './createElement.js'

const DAILY_SUMMARY = 'DAILY_SUMMARY'
const HOURLY_SUMMARY = 'HOURLY_SUMMARY'
const FINE_GRAINED = 'FINE_GRAINED'

const commonSummaryFunctions = {
    visualisationBlock: (dateFormatter, data, timestamp) => {
        const uptimePercent = roundToTwoDp(data[timestamp].uptime * 100)

        const formatted = dateFormatter.format(new Date(timestamp))

        return element('div', { classes: ['availability-block'] }, [
            element('div', { classes: ['availability-block', 'unavailable'], style: `height: ${100 - uptimePercent}%`}, null),
            element('div', { classes: ['availability-block', 'available'], style: `height: ${uptimePercent}%`}, null),
            element('div', { classes: ['availability-details'] }, [
                element('p', formatted),
                element('p', `Uptime: ${uptimePercent}%`),
            ])
        ])
    },
    uptime: (data) => {
        const uptimeProportions = Object.values(data).map(it => it.uptime)
        return proportionsToPercent(uptimeProportions)
    }
}

const lookup = {
    DAILY_SUMMARY: {
        ...commonSummaryFunctions,
        label: 'Last 24 days',
        timeFormat: {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        },
    },
    HOURLY_SUMMARY: {
        ...commonSummaryFunctions,
        label: 'Last 24 hours',
        timeFormat: {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        },
    },
    FINE_GRAINED: {
        label: 'Last 2 hours',
        timeFormat: {
            hour: 'numeric',
            minute: '2-digit',
        },
        visualisationBlock: (dateFormatter, data, timestamp) => {
            const time = dateFormatter.format(new Date(timestamp))
            const status = data[timestamp]

            return element('div', { classes: [`availability-block ${status}`]}, [
                element('div', { classes: ['availability-details'] }, [
                    element('p', time),
                    element('p', status),
                ])
            ])
        },
        uptime: (data) => {
            const availabilityAsProportions = Objects.values(data).map(it => it === 'available' ? 1 : 0)
            return proportionsToPercent(availabilityAsProportions)
        }
    },
}

function timespanSummary(timespanType, data, timeZone) {
    const config = lookup[timespanType]
    const dateFormatter = createDateFormatter(timeZone, config.timeFormat)
    const visualisationBlocks = Object.keys(data).map(date => config.visualisationBlock(dateFormatter, data, date))

    return element('div', { classes: ['timespan-container'] }, [
        element('span', { classes: ['label'] }, config.label),
        element('span', { classes: ['availability-container'] }, visualisationBlocks),
    ])
}

function createDateFormatter(timeZone, config) {
    return new Intl.DateTimeFormat(undefined /* user agent default*/, {
            ...config,
            timeZone: timeZone.name,
        })
}

function proportionsToPercent(proportions) {
    if (proportions.every(it => it == 1)) {
        return '100%'
    }

    const sum = proportions.reduce((a, b) => (a+ b))
    const average = sum / roportions.length
    if (average > '0.9999') {
        return '> 99.99%'
    } else {
        return `${roundToTwoDp(average)}%`
    }
}

function roundToTwoDp(number) {
    const times100 = number * 100
    const rounded = Math.round(times100)
    return rounded * 0.01
}

export { DAILY_SUMMARY, HOURLY_SUMMARY, FINE_GRAINED, timespanSummary }
