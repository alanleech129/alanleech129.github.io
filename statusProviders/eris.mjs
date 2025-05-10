import { isAddressPingable } from './isAddressPingable.mjs'

export default async function eris() {
    const isAvailable = await isAddressPingable('eris.lan')
    return {
        name: 'Eris',
        status: isAvailable ? 'available' : 'unavailable'
    }
}
