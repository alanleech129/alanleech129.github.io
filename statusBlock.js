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

        const style = document.createElement('style')
        style.textContent = STYLE_CONTENT
        shadow.appendChild(style)

        const name = this.getAttribute('name')
        const data = await getData(name)

        const content = document.createElement('div')
        content.classList ='namespace'

        content.insertAdjacentHTML('afterBegin', `<h2>${name}</h2>`)
        this.insertAvailabilityRows(content, data)

        shadow.appendChild(content)
    }

    insertAvailabilityRows(statusContainer, data) {
        const last24Days = this.timespanSummary('Last 24 days', this.last24Days(data))
        const last24Hours = this.timespanSummary('Last 24 hours', this.last24Hours(data))
        const lastTwoHours = this.timespanSummary('Last two hours', this.lastTwoHours(data))

        statusContainer.insertAdjacentElement('beforeEnd', last24Days)
        statusContainer.insertAdjacentElement('beforeEnd', last24Hours)
        statusContainer.insertAdjacentElement('beforeEnd', lastTwoHours)
    }

    timespanSummary(label, data) {
        const container = document.createElement('div')
        container.classList = 'timespan-container'

        const labelElement = document.createElement('span')
        labelElement.classList = 'label'
        labelElement.innerText = label
        container.insertAdjacentElement('beforeEnd', labelElement)

        const availabilityContainer = document.createElement('span')
        availabilityContainer.classList = 'availability-container'
        data.forEach(block => availabilityContainer.insertAdjacentElement('beforeEnd', block))
        container.insertAdjacentElement('beforeEnd', availabilityContainer)

        return container
    }

    last24Days(data) {
        return Object.keys(data.summarisedByDate)
            .sort()
            .slice(-24)
            .map(timestamp => {
                const uptimePercent = this.roundToTwoDp(data.summarisedByDate[timestamp].uptime * 100)

                const container = document.createElement('div')
                container.classList = 'availability-block'

                const available = document.createElement('div')
                available.setAttribute('style', `height: ${uptimePercent}%`)
                available.classList = 'availability-block available'

                const unavailable = document.createElement('div')
                unavailable.setAttribute('style', `height: ${100 - uptimePercent}%`)
                unavailable.classList = 'availability-block unavailable'

                const details = document.createElement('div')
                details.classList = 'availability-details'
                details.innerHTML = `<p>${timestamp}</p><p>Uptime: ${uptimePercent}%</p>`

                container.insertAdjacentElement('beforeEnd', unavailable)
                container.insertAdjacentElement('beforeEnd', available)
                container.insertAdjacentElement('beforeEnd', details)

                return container
            })
    }

    last24Hours(data) {
        return Object.keys(data.summarisedByHour)
            .sort()
            .slice(-24)
            .map(timestamp => {
                const uptimePercent = this.roundToTwoDp(data.summarisedByHour[timestamp].uptime * 100)

                const container = document.createElement('div')
                container.classList = 'availability-block'

                const available = document.createElement('div')
                available.setAttribute('style', `height: ${uptimePercent}%`)
                available.classList = 'availability-block available'

                const unavailable = document.createElement('div')
                unavailable.setAttribute('style', `height: ${100 - uptimePercent}%`)
                unavailable.classList = 'availability-block unavailable'

                const [date, time] = timestamp.split('T')
                const hourAs12HourZeroBased = Number.parseInt(time) % 12
                const hourAs12Hour = hourAs12HourZeroBased === 0 ? 12 : hourAs12HourZeroBased
                const amOrPm = Number.parseInt(time) < 12 ? 'am' : 'pm'
                const formattedDateTime = `${date} ${hourAs12Hour}${amOrPm}`
                const details = document.createElement('div')
                details.classList = 'availability-details'
                details.innerHTML = `<p>${formattedDateTime}</p><p>Uptime: ${uptimePercent}%</p>`

                container.insertAdjacentElement('beforeEnd', unavailable)
                container.insertAdjacentElement('beforeEnd', available)
                container.insertAdjacentElement('beforeEnd', details)

                return container
            })
    }

    lastTwoHours(data) {
        return Object.keys(data.fineGrainedData)
            .sort()
            .slice(-24)
            .map(timestamp => {
                const time = timestamp.split('T')[1]
                const status = data.fineGrainedData[timestamp]

                const block = document.createElement('div')
                block.classList = `availability-block ${status}`

                const details = document.createElement('div')
                details.classList = 'availability-details'
                details.innerHTML = `<p>${time}</p><p>${status}</p>`
                block.insertAdjacentElement('beforeEnd', details)

                return block
            })
    }

    roundToTwoDp(number) {
        const times100 = number * 100
        const rounded = Math.round(times100)
        return rounded * 0.01
    }
}

customElements.define('status-block', StatusBlock)
