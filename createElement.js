function element(type, optionsOrContent, contentOrUndefined) {
    const contentOrUndefinedIsNull = contentOrUndefined === null
    const isContentOrUndefinedPresent = contentOrUndefinedIsNull || Boolean(contentOrUndefined)

    const content = isContentOrUndefinedPresent ? contentOrUndefined : optionsOrContent
    const options = isContentOrUndefinedPresent ? optionsOrContent : {}
    const e = document.createElement(type)

    if (options.classes) {
        e.setAttribute('class', options.classes.join(' '))
    }
    if (options.eventListeners) {
        for (const eventName in options.eventListeners) {
            e.addEventListener(eventName, options.eventListeners[eventName])
        }
    }
    for (const attribute in options) {
        if (attribute === 'classes' || attribute === 'eventListeners') {
            continue
        }
        e.setAttribute(attribute, options[attribute])
    }

    function addContentToElement(contentToAdd) {
        if (contentToAdd === null) {
            return
        } else if (typeof contentToAdd === 'function') {
            addContentToElement(contentToAdd())
        } else if (contentToAdd instanceof Element) {
            e.insertAdjacentElement('beforeEnd', contentToAdd)
        } else {
            e.insertAdjacentHTML('beforeEnd', contentToAdd)
        }
    }

    if (Array.isArray(content)) {
        content.forEach(it => addContentToElement(it))
    } else {
        addContentToElement(content)
    }

    return e
}

export default element
