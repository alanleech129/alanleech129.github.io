import element from './createElement.js'
import { DAILY_SUMMARY, HOURLY_SUMMARY, FINE_GRAINED, timespanSummary } from './timespanSummary.js'
import { onData } from './dataProvider.js'

const STYLE_CONTENT = `
    .namespace {
        margin: 2em;
    }

    .summary {
        font-weight: bold;
        margin: 1em;
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

        .uptime {
            padding: 0.5em
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

    connectedCallback() {
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
                this.summary(this.data),
                timespanSummary(DAILY_SUMMARY, this.data.summarisedByDate, this.timeZone),
                timespanSummary(HOURLY_SUMMARY, this.data.summarisedByHour, this.timeZone),
                timespanSummary(FINE_GRAINED, this.recentFineGrainedData(), this.timeZone),
            ])

            this.content.replaceWith(content)
            this.content = content
        }
    }

    recentFineGrainedData() {
        const recent = {}
        Object.keys(this.data.fineGrainedData)
            .sort()
            .slice(-24)
            .forEach(timestamp => {
                recent[timestamp] = this.data.fineGrainedData[timestamp]
            })
        return recent
    }

    summary(data) {
        const mostRecentTimestamp = Object.keys(data.fineGrainedData).sort().reverse()[0]
        const formatter = new Intl.DateTimeFormat(undefined /* user agent default*/, {
            timeZone: this.timeZone.name,
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
        const formattedDateTime = formatter.format(new Date(mostRecentTimestamp))
        const status = data.fineGrainedData[mostRecentTimestamp]
        return element('div', { classes: ['summary'] }, `${formattedDateTime}: ${status}`)
    }
}

customElements.define('status-block', StatusBlock)
