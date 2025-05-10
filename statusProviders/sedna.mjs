import { isAddressPingable } from './isAddressPingable.mjs'

export default async function sedna() {
    const isAvailable = await isAddressPingable('sedna.lan')
    return {
        name: 'Sedna',
        status: isAvailable ? 'available' : 'unavailable'
    }
}
