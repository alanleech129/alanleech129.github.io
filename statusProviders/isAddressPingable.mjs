import { exec } from 'node:child_process'

async function isAddressPingable(address) {
    return new Promise((resolve) => {
        exec(`ping -c1 -W5 ${address}`, (err) => {
            if (err && err.code !== 0) {
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}

export { isAddressPingable }
