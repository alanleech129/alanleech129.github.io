const STYLE_CONTENT = `
    .status-container {
        margin: 2em;
    }

    .availability-container {
        display: grid;
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
    }

    .availability-date {
        margin-left: 1em;
    }
`

class StatusBlock extends HTMLElement {
    async connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' })

        const style = document.createElement('style')
        style.textContent = STYLE_CONTENT
        shadow.appendChild(style)

        const name = this.getAttribute('name')
        const data = await this.fetchData(name)

        const content = document.createElement('div')
        content.classList ='status-container'

        content.insertAdjacentHTML('afterBegin', `<h2>${name}</h2>`)

        const statusContainer = document.createElement('div')
        statusContainer.classList = 'availability-container'

        this.dataToListOfAvailabilityElements(data)
            .forEach(block => statusContainer.insertAdjacentElement('beforeEnd', block))

        content.insertAdjacentElement('beforeEnd', statusContainer)

        shadow.appendChild(content)
    }

    async fetchData(name) {
        const response = await fetch('data.json')
        if (!response.ok) {
            throw new Error(response)
        }
        const data = await response.json()
        return data[name]
    }

    dataToListOfAvailabilityElements(data) {
        return Object.keys(data)
            .sort()
            .map(time => {
                const block = document.createElement('div')
                const status = data[time]
                block.classList = `availability-block ${status}`
                return block
            })
    }
}

customElements.define('status-block', StatusBlock)
