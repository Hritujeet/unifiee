export function getFormDataValue(formData: FormData, key: string): unknown {
    const values = formData.getAll(key)
    if (values.length > 1) return values
    return values[0]
}

export function getOptionalFormDataText(formData: FormData, key: string): unknown {
    const value = getFormDataValue(formData, key)
    if (typeof value !== "string") return value
    return value.trim() || undefined
}

export function getFormDataLines(formData: FormData, key: string, separator = /\r?\n/): unknown {
    const values = formData.getAll(key)
    if (values.some((value) => typeof value !== "string")) return values

    return values.flatMap((value) => {
        if (typeof value !== "string") return []
        return value.split(separator).map((item) => item.trim()).filter(Boolean)
    })
}
