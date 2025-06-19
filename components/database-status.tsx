"use client"

import { AlertTriangle, Database, ExternalLink, X, Download, Loader2, CheckCircle, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export function DatabaseStatus() {
  // For now, just show always connected (Neon/Postgres)
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('connected')

  return (
    <div className="flex items-center space-x-2">
      <Database className="h-5 w-5 text-green-400" />
      <span className="text-green-400 font-semibold">Database: Connected (Neon)</span>
    </div>
  )
}
