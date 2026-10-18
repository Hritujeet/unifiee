"use client"
import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // With SSR, we usually want to set some default staleTime
                // above 0 to avoid refetching immediately on the client
                staleTime: 60 * 1000,
                refetchOnWindowFocus: false,
            },
        },
    })
}

const TanstackQueryProvider = ({ children }: { children: React.ReactNode }) => {
    const [client] = useState(makeQueryClient)
    return (
        <QueryClientProvider client={client}>
            {children}
        </QueryClientProvider>
    )
}

export default TanstackQueryProvider