import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'Relay — Move environments. Keep secrets local.', description: 'Private environment handoffs for development teams.' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body>{children}</body></html> }
