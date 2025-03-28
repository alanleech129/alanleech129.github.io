import { getData } from './dataProvider.js'

const STYLE_CONTENT = `
    .namespace {
        margin: 2em;
    }

    .timespan-container {
        display: flex;
        align-items: center;

        .label {
            display: inline;
            padding: 0.5em;
        }

        .availability-container {
            display: inline grid;
            grid-template-columns: repeat(24, 1fr); /* 7em; for the date */
            width: 16em;
        }

        .availability-block {
            height: 2em;
            width: 0.5em;
            margin: 0.1em;

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
        const last24Hours = this.timespanSummary('Last 24 hours', this.last24Hours(data))
        const lastTwoHours = this.timespanSummary('Last two hours', this.lastTwoHours(data))

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
        data.map(({label, status}) => {
                const block = document.createElement('div')
                block.classList = `availability-block ${status}`

                const details = document.createElement('div')
                details.classList = 'availability-details'
                details.innerHTML = `<p>${label}</p><p>${status}</p>`
                block.insertAdjacentElement('beforeEnd', details)

                return block
            })
            .forEach(block => availabilityContainer.insertAdjacentElement('beforeEnd', block))
        container.insertAdjacentElement('beforeEnd', availabilityContainer)

        return container
    }

    last24Hours(data) {
        return Object.keys(data.summarisedByHour)
            .sort()
            .slice(-24)
            .map(dt => ({
                label: dt,
                status: data.summarisedByHour[dt]
            }))
    }

    lastTwoHours(data) {
        return Object.keys(data.fineGrainedData)
            .sort()
            .slice(-24)
            .map(dt => {
                const time = dt.split('T')[1]
                const status = data.fineGrainedData[dt]
                return {
                    label: time,
                    status
                }
            })
    }
}

customElements.define('status-block', StatusBlock)
