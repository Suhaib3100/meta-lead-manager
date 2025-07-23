"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Facebook, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react"

interface TokenStatus {
  hasToken: boolean
  isValid: boolean
  expiresAt?: string
  message: string
}

export function FacebookTokenManager() {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [shortLivedToken, setShortLivedToken] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    checkTokenStatus()
  }, [])

  const checkTokenStatus = async () => {
    try {
      const response = await fetch('/api/facebook/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ action: 'check' })
      })
      const data = await response.json()
      setTokenStatus(data)
    } catch (error) {
      console.error('Error checking token status:', error)
    }
  }

  const exchangeToken = async () => {
    if (!shortLivedToken.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a short-lived token',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/facebook/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ 
          action: 'exchange', 
          token: shortLivedToken 
        })
      })
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: `Token exchanged successfully! ${data.pagesConnected} pages connected.`,
        })
        setShortLivedToken("")
        await checkTokenStatus()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to exchange token',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to exchange token',
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  const refreshToken = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/facebook/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ action: 'refresh' })
      })
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Token refreshed successfully!',
        })
        await checkTokenStatus()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to refresh token',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh token',
        variant: 'destructive',
      })
    }
    setIsRefreshing(false)
  }

  const getStatusIcon = () => {
    if (!tokenStatus?.hasToken) return <AlertCircle className="w-5 h-5 text-gray-400" />
    if (tokenStatus.isValid) return <CheckCircle className="w-5 h-5 text-green-500" />
    return <AlertCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusBadge = () => {
    if (!tokenStatus?.hasToken) return <Badge variant="secondary">No Token</Badge>
    if (tokenStatus.isValid) return <Badge className="bg-green-600">Valid</Badge>
    return <Badge variant="destructive">Expired</Badge>
  }

  return (
    <Card className="bg-[#1C1D21] border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Facebook className="w-5 h-5" />
          Facebook Token Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Status */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="text-sm font-medium text-white">
                {tokenStatus?.hasToken ? 'Long-lived Token' : 'No Token Configured'}
              </p>
              <p className="text-xs text-gray-400">{tokenStatus?.message}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Expiration Info */}
        {tokenStatus?.expiresAt && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Expires: {new Date(tokenStatus.expiresAt).toLocaleDateString()}</span>
          </div>
        )}

        {/* Token Exchange */}
        {!tokenStatus?.hasToken && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Short-lived Token
              </label>
              <Input
                placeholder="Enter your short-lived Facebook token..."
                value={shortLivedToken}
                onChange={(e) => setShortLivedToken(e.target.value)}
                className="bg-[#0A0B0F] border-gray-800"
              />
            </div>
            <Button
              onClick={exchangeToken}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Exchanging Token...
                </>
              ) : (
                <>
                  <Facebook className="w-4 h-4 mr-2" />
                  Exchange for Long-lived Token
                </>
              )}
            </Button>
          </div>
        )}

        {/* Token Refresh */}
        {tokenStatus?.hasToken && (
          <div className="space-y-3">
            <Button
              onClick={refreshToken}
              disabled={isRefreshing}
              variant="outline"
              className="w-full bg-transparent"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing Token...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Token (Extend 60 days)
                </>
              )}
            </Button>
            <Button
              onClick={checkTokenStatus}
              variant="ghost"
              size="sm"
              className="w-full text-gray-400"
            >
              Check Status
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>How to get a short-lived token:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Facebook Graph API Explorer</a></li>
            <li>Select your app and click "Generate Access Token"</li>
            <li>Grant the required permissions (pages_read_engagement, pages_show_list)</li>
            <li>Copy the generated token and paste it above</li>
            <li>Click "Exchange for Long-lived Token"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
} 