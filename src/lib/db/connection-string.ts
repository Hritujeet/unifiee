const legacySslModes = new Set(["prefer", "require", "verify-ca"])

export function normalizeDatabaseConnectionString(connectionString: string): string {
    if (!/^postgres(?:ql)?:\/\//i.test(connectionString)) return connectionString

    const url = new URL(connectionString)
    const sslMode = url.searchParams.get("sslmode")
    if (sslMode && legacySslModes.has(sslMode.toLowerCase())) {
        url.searchParams.set("sslmode", "verify-full")
    }

    return url.toString()
}
