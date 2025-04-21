import element from './createElement.js'
import { getData } from './dataProvider.js'

const STYLE_CONTENT = `
    .namespace {
        margin: 2em;
    }

    .timespan-container {
        display: flex;
        align-items: center;
        margin: 0.5em;

        .label {
            display: inline;
            padding: 0.5em;
            width: 7em;
        }

        .availability-container {
            display: inline flex;
            justify-content: flex-end;
            width: 16.6em;
            gap: 0.2em;
        }

        .availability-block {
            height: 2em;
            width: 0.5em;

            &.available {
                background-color: green;
            }

            &.unavailable {
                background-color: red;
            }

            .availability-details {
                display: none;
            }

            &:hover .availability-details {
                display: inline-block;
                position: relative;
                top: 3em;
                padding: 0.5em;
                border: solid black 1px;
                text-wrap-mode: nowrap;
                background: white;

                p {
                    margin: 0;
                }
            }
        }

        .availability-date {
            margin-left: 1em;
        }
    }
`

class StatusBlock extends HTMLElement {
    async connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' })

        const name = this.getAttribute('name')
        const data = await getData(name)

        const content = element('div', { classes: ['namespace'] }, [
            element('h2', name),
            this.timespanSummary('Last 24 days', this.last24Days(data)),
            this.timespanSummary('Last 24 hours', this.last24Hours(data)),
            this.timespanSummary('Last two hours', this.lastTwoHours(data)),
        ])

        shadow.appendChild(element('style', STYLE_CONTENT))
        shadow.appendChild(content)
    }

    timespanSummary(label, data) {
        return element('div', { classes: ['timespan-container'] }, [
            element('span', { classes: ['label'] }, label),
            element('span', { classes: ['availability-container'] }, data),
        ])
    }

    last24Days(data) {
        return Object.keys(data.summarisedByDate)
            .sort()
            .slice(-24)
            .map(timestamp => {
                const uptimePercent = this.roundToTwoDp(data.summarisedByDate[timestamp].uptime * 100)

                return element('div', { classes: ['availability-block'] }, [
                    element('div', { classes: ['availability-block unavailable'], style: `height: ${100 - uptimePercent}%`}, null),
                    element('div', { classes: ['availability-block available'], style: `height: ${uptimePercent}%`}, null),
                    element('div', { classes: ['availability-details'] }, [
                        element('p', timestamp),
                        element('p', `Uptime: ${uptimePercent}`),
                    ])
                ])
            })
    }

    last24Hours(data) {
        return Object.keys(data.summarisedByHour)
            .sort()
            .slice(-24)
            .map(timestamp => {
                const uptimePercent = this.roundToTwoDp(data.summarisedByHour[timestamp].uptime * 100)

                const [date, time] = timestamp.split('T')
                const hourAs12HourZeroBased = Number.parseInt(time) % 12
                const hourAs12Hour = hourAs12HourZeroBased === 0 ? 12 : hourAs12HourZeroBased
                const amOrPm = Number.parseInt(time) < 12 ? 'am' : 'pm'
                const formattedDateTime = `${date} ${hourAs12Hour}${amOrPm}`

                return element('div', { classes: ['availability-block'] }, [
                    element('div', { classes: ['availability-block unavailable'], style: `height: ${100 - uptimePercent}%`}, null),
                    element('div', { classes: ['availability-block available'], style: `height: ${uptimePercent}%`}, null),
                    element('div', { classes: ['availability-details'] }, [
                        element('p', formattedDateTime),
                        element('p', `Uptime: ${uptimePercent}`),
                    ])
                ])
            })
    }

    lastTwoHours(data) {
        return Object.keys(data.fineGrainedData)
            .sort()
            .slice(-24)
            .map(timestamp => {
                const time = timestamp.split('T')[1]
                const status = data.fineGrainedData[timestamp]

                return element('div', { classes: [`availability-block ${status}`]}, [
                    element('div', { classes: ['availability-details'] }, [
                        element('p', time),
                        element('p', status),
                    ])
                ])
            })
    }

    roundToTwoDp(number) {
        const times100 = number * 100
        const rounded = Math.round(times100)
        return rounded * 0.01
    }
}

customElements.define('status-block', StatusBlock)
