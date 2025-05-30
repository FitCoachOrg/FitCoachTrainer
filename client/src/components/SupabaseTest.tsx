import { useEffect, useState } from 'react'
import { testConnection } from '@/lib/supabase'

export function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<{
    checked: boolean
    success?: boolean
    error?: string
  }>({ checked: false })

  // Add environment variable check
  const envStatus = {
    url: import.meta.env.VITE_SUPABASE_URL ? '✓ Present' : '✗ Missing',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Present' : '✗ Missing'
  }

  useEffect(() => {
    async function checkConnection() {
      const result = await testConnection()
      setConnectionStatus({
        checked: true,
        success: result.success,
        error: 'error' in result ? result.error : undefined
      })
    }

    checkConnection()
  }, [])

  return (
    <div className="p-4 rounded-lg border border-black dark:border-neutral-600  dark:bg-black">
      <h2 className="text-lg font-semibold mb-2">Supabase Connection Status</h2>
      
      {/* Environment Variables Status */}
      <div className="mb-4">
        <h3 className="text-md font-medium mb-1">Environment Variables:</h3>
        <ul className="text-sm space-y-1">
          <li>
            <span className={envStatus.url.includes('✓') ? 'text-green-600' : 'text-red-600'}>
              SUPABASE_URL: {envStatus.url}
            </span>
          </li>
          <li>
            <span className={envStatus.key.includes('✓') ? 'text-green-600' : 'text-red-600'}>
              SUPABASE_ANON_KEY: {envStatus.key}
            </span>
          </li>
        </ul>
      </div>

      {/* Connection Status */}
      {!connectionStatus.checked ? (
        <p>Checking connection...</p>
      ) : connectionStatus.success ? (
        <p className="text-green-600">✓ Connected to Supabase successfully!</p>
      ) : (
        <div>
          <p className="text-red-600">✗ Connection failed</p>
          {connectionStatus.error && (
            <p className="text-sm text-gray-600 mt-1">Error: {connectionStatus.error}</p>
          )}
        </div>
      )}
    </div>
  )
} 