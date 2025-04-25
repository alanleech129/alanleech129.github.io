import element from './createElement.js'
import { onData } from './dataProvider.js'

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

const UTC = { name: 'UTC', type: 'utc', offset: 0, offsetFormatted: '+00:00' }

class StatusBlock extends HTMLElement {
    static observedAttributes = ['time-zone'];

    constructor() {
        super()
        this.timeZone = UTC
        this.data = undefined
    }

    async connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' })

        const name = this.getAttribute('name')
        onData(name, (data) => {
            this.data = data
            this.update()
        })

        this.content = element('div', 'Loading...')

        shadow.appendChild(element('style', STYLE_CONTENT))
        shadow.appendChild(element('div', { classes: ['namespace'] }, [
            element('h2', name),
            this.content,
        ]))

        this.update()
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'time-zone') {
            this.timeZone = JSON.parse(newValue)
            this.update()
        }
    }

    update() {
        if (this.data) {
            const content = element('div', [
                this.timespanSummary('Last 24 days', this.last24Days(this.data)),
                this.timespanSummary('Last 24 hours', this.last24Hours(this.data)),
                this.timespanSummary('Last two hours', this.lastTwoHours(this.data)),
            ])

            this.content.replaceWith(content)
            this.content = content
        }
    }

    timespanSummary(label, data) {
        return element('div', { classes: ['timespan-container'] }, [
            element('span', { classes: ['label'] }, label),
            element('span', { classes: ['availability-container'] }, data),
        ])
    }

    last24Days(data) {
        const formatter = new Intl.DateTimeFormat(undefined /* user agent default*/, {
            timeZone: this.timeZone.name,
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
        return Object.keys(data.summarisedByDate)
            .sort()
            .slice(-24)
            .map(timestamp => {
                const uptimePercent = this.roundToTwoDp(data.summarisedByDate[timestamp].uptime * 100)

                const formatted = formatter.format(new Date(timestamp))

                return element('div', { classes: ['availability-block'] }, [
                    element('div', { classes: ['availability-block', 'unavailable'], style: `height: ${100 - uptimePercent}%`}, null),
                    element('div', { classes: ['availability-block', 'available'], style: `height: ${uptimePercent}%`}, null),
                    element('div', { classes: ['availability-details'] }, [
                        element('p', formatted),
                        element('p', `Uptime: ${uptimePercent}%`),
                    ])
                ])
            })
    }

    last24Hours(data) {
        const formatter = new Intl.DateTimeFormat(undefined /* user agent default*/, {
            timeZone: this.timeZone.name,
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
        return Object.keys(data.summarisedByHour)
            .sort()
            .slice(-24)
            .map(timestamp => {
                const uptimePercent = this.roundToTwoDp(data.summarisedByHour[timestamp].uptime * 100)

                const asDate = new Date(timestamp)
                const formattedDateTime = formatter.format(asDate)

                return element('div', { classes: ['availability-block'] }, [
                    element('div', { classes: ['availability-block', 'unavailable'], style: `height: ${100 - uptimePercent}%`}, null),
                    element('div', { classes: ['availability-block', 'available'], style: `height: ${uptimePercent}%`}, null),
                    element('div', { classes: ['availability-details'] }, [
                        element('p', formattedDateTime),
                        element('p', `Uptime: ${uptimePercent}%`),
                    ])
                ])
            })
    }

    lastTwoHours(data) {
        const formatter = new Intl.DateTimeFormat(undefined /* user agent default*/, {
            timeZone: this.timeZone.name,
            hour: 'numeric',
            minute: '2-digit',
        })
        return Object.keys(data.fineGrainedData)
            .sort()
            .slice(-24)
            .map(timestamp => {
                const asDate = new Date(timestamp)
                const time = formatter.format(asDate)
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

    dateFromZuluIso8601WithMinutes(input) {
        const [inputWithoutZ] = input.split('Z')
        const [date, time] = inputWithoutZ.split('T')
        const [year, oneBasedMonth, day] = date.split('-')
        const [hours, minutes] = time.split(':')

        return new Date(year, oneBasedMonth - 1, day, hours, minutes)
    }
}

customElements.define('status-block', StatusBlock)
