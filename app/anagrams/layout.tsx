import type React from "react"

export default function AnagramsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div className="min-h-screen bg-[#013220] flex items-center justify-center">{children}</div>
}
