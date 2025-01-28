let dataAvailable = false
let data = undefined
const dataQueue = []

async function fetchData() {
    const response = await fetch('data.json')
    if (!response.ok) {
        throw new Error(response)
    }
    data = await response.json()
    dataAvailable = true
    dataQueue.forEach(it => it(data))
}

async function getData(name) {
    if (dataAvailable) {
        return data[name]
    } else {
        return new Promise((resolve, reject) => {
            dataQueue.push(data => resolve(data[name]))
        })
    }
}

fetchData()

export { getData }
