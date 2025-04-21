import element from './createElement.js'

const STYLE_CONTENT = `
    .container {
        border: solid black 1px;
        width: fit-content;
        padding: 0.5em;
    }

    .input-container {
        padding-left: 1em;
        padding-right: 1em;
        margin-left: 1em;
    }

    .warning {
        color: red;
    }
`

const UTC = { name: 'UTC', type: 'utc', offset: 0, offsetFormatted: '+00:00' }

const WARNING_MESSAGES = {
    nonUtc: 'Your time zone is not UTC. Daily statistics are still aggregated by UTC days.',
    fractionalHour: 'Your time zone is not a whole number of hours offset from UTC. Hourly statistics are still aggregated by UTC hours, and the times displayed will be off by up to an hour.',
}

class TimeZoneSelector extends HTMLElement {
    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' })

        const localTimeZone = this.localTimeZone()
        const selectedTimeZone = localStorage.getItem('timeZone') === 'utc' ? UTC : localTimeZone

        const onTimezoneUpdated = (timeZone) => {
            shadow.dispatchEvent(new CustomEvent('change', {bubles: true, composed: true, detail: timeZone}))
            summaryElement.innerText = this.summary(timeZone)
            warningElement.replaceChildren(...this.warningMessages(timeZone))
            localStorage.setItem('timeZone', timeZone.type)
        }

        const summaryElement = element('summary', this.summary(selectedTimeZone))

        const detailsElement = element('details', [
            summaryElement,
            element('div', { classes: ['input-container'] }, [
                element('p',
                    element('label', [
                        element('input', function () {
                            const options = {
                                type: 'radio',
                                name: 'timezone',
                                value: 'utc',
                                eventListeners: {
                                    change: () => onTimezoneUpdated(UTC)
                                }
                            }
                            if (selectedTimeZone === UTC) options.checked = 'checked'
                            return options
                        }(), null),
                        'UTC',
                    ])
                ),
                element('p',
                    element('label', [
                        element('input', function() {
                            const options = {
                                type: 'radio',
                                name: 'timezone',
                                value: 'local',
                                eventListeners: {
                                    change: () => onTimezoneUpdated(localTimeZone)
                                }
                            }
                            if (selectedTimeZone === localTimeZone) options.checked = 'checked'
                            return options
                        }(), null),
                        `${localTimeZone.name} (UTC ${localTimeZone.offsetFormatted})`,
                    ]),
                ),
            ])
        ])

        const warningElement = element('div', { classes: ['warning'] }, this.warningMessages(selectedTimeZone))

        const container = element('div', { classes: ['container'] }, [
            detailsElement,
            warningElement,
        ])

        shadow.appendChild(element('style', STYLE_CONTENT))
        shadow.appendChild(container)

        onTimezoneUpdated(selectedTimeZone)
    }

    localTimeZone() {
        const localTimeZoneName = new Intl.DateTimeFormat().resolvedOptions().timeZone
        const offsetInMinutes = new Date().getTimezoneOffset()
        const offsetInHoursAndMinutes = this.minutesToHoursAndMinutes(new Date().getTimezoneOffset())

        return {
            name: localTimeZoneName,
            type: 'local',
            offset: offsetInMinutes,
            offsetFormatted: offsetInHoursAndMinutes
        }
    }

    summary(timeZone) {
        if (timeZone.name === 'UTC') {
            return `Times are in ${timeZone.name}`
        } else {
            return `Times are in ${timeZone.name} (UTC ${timeZone.offsetFormatted})`
        }
    }

    warningMessages(timeZone) {
        const messages = []
        if (timeZone.offset !== 0) {
            messages.push(WARNING_MESSAGES.nonUtc)
        }
        if (timeZone.offset % 60 !== 0) {
            messages.push(WARNING_MESSAGES.fractionalHour)
        }

        return messages.map(message => element('p', message))
    }

    minutesToHoursAndMinutes(vulgarMinutes) {
        const isPositive = vulgarMinutes >= 0
        const fractionalHours = vulgarMinutes / 60
        const hours = Math.abs(isPositive ? Math.floor(fractionalHours) : Math.ceil(fractionalHours))

        const minutes = Math.abs(vulgarMinutes % 60)

        const hoursAndMinutes = `${isPositive ? '+' : '-'}${this.to2Digits(hours)}:${this.to2Digits(minutes)}`

        return hoursAndMinutes
    }

    to2Digits(number) {
        if (number < 10) return `0${number}`
        else return `${number}`
    }
}

customElements.define('time-zone-selector', TimeZoneSelector)
