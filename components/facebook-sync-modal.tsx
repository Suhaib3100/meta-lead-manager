"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Facebook, Loader2, CheckCircle, AlertCircle, Zap, Calendar, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FacebookSyncModalProps {
  isOpen: boolean
  onClose: () => void
  onSync: (pageId: string, formId: string) => void
}

const mockPages = [
  { id: "page_1", name: "Pronexus Marketing", followers: "12.5K" },
  { id: "page_2", name: "Tech Solutions Co", followers: "8.2K" },
  { id: "page_3", name: "Digital Agency Pro", followers: "15.8K" },
]

const mockForms = [
  { id: "form_1", name: "Website Lead Form", leads: 45, page: "page_1" },
  { id: "form_2", name: "Contact Us Form", leads: 23, page: "page_1" },
  { id: "form_3", name: "Demo Request Form", leads: 67, page: "page_2" },
  { id: "form_4", name: "Newsletter Signup", leads: 156, page: "page_3" },
]

export function FacebookSyncModal({ isOpen, onClose, onSync }: FacebookSyncModalProps) {
  const [selectedPage, setSelectedPage] = useState("")
  const [selectedForm, setSelectedForm] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  const handleConnect = async () => {
    setIsConnecting(true)
    // Simulate API connection
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsConnected(true)
    setIsConnecting(false)
    toast({
      title: "Connected Successfully",
      description: "Facebook Lead Ads API connected successfully",
    })
  }

  const handleSync = async () => {
    if (!selectedPage || !selectedForm) {
      toast({
        title: "Selection Required",
        description: "Please select both a page and form to sync",
        variant: "destructive",
      })
      return
    }

    setIsSyncing(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsSyncing(false)
    onSync(selectedPage, selectedForm)
    onClose()
  }

  const filteredForms = mockForms.filter((form) => form.page === selectedPage)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Facebook className="w-5 h-5 text-white" />
            </div>
            Facebook Lead Ads Sync
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Connection Status */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                {isConnected ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                )}
                API Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="accessToken" className="text-gray-300">
                      Facebook Access Token
                    </Label>
                    <Input
                      id="accessToken"
                      type="password"
                      placeholder="Enter your Facebook Graph API access token..."
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="bg-black border-gray-700 text-white placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-400">Get your access token from Facebook Developers Console</p>
                  </div>
                  <Button
                    onClick={handleConnect}
                    disabled={!accessToken || isConnecting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Facebook className="w-4 h-4 mr-2" />
                        Connect to Facebook
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-green-900/20 rounded-lg border border-green-800/30">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="font-medium text-green-300">Successfully Connected</p>
                    <p className="text-sm text-green-400">Ready to sync lead data from Facebook</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Page & Form Selection */}
          {isConnected && (
            <>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <Users className="w-5 h-5" />
                    Select Facebook Page
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedPage} onValueChange={setSelectedPage}>
                    <SelectTrigger className="bg-black border-gray-700 text-white">
                      <SelectValue placeholder="Choose a Facebook page..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {mockPages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{page.name}</span>
                            <Badge variant="secondary" className="ml-2 bg-gray-800 text-gray-300">
                              {page.followers} followers
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedPage && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      {mockPages
                        .filter((page) => page.id === selectedPage)
                        .map((page) => (
                          <div key={page.id} className="bg-blue-900/20 rounded-lg p-4 border border-blue-800/30">
                            <h4 className="font-medium text-blue-300">{page.name}</h4>
                            <p className="text-sm text-blue-400">{page.followers} followers</p>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedPage && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white">
                      <Zap className="w-5 h-5" />
                      Select Lead Form
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select value={selectedForm} onValueChange={setSelectedForm}>
                      <SelectTrigger className="bg-black border-gray-700 text-white">
                        <SelectValue placeholder="Choose a lead form..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {filteredForms.map((form) => (
                          <SelectItem key={form.id} value={form.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{form.name}</span>
                              <Badge variant="secondary" className="ml-2 bg-gray-800 text-gray-300">
                                {form.leads} leads
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedForm && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {filteredForms
                          .filter((form) => form.id === selectedForm)
                          .map((form) => (
                            <div key={form.id} className="bg-purple-900/20 rounded-lg p-4 border border-purple-800/30">
                              <h4 className="font-medium text-purple-300">{form.name}</h4>
                              <p className="text-sm text-purple-400">{form.leads} total leads</p>
                              <div className="flex items-center gap-1 mt-2 text-xs text-purple-400">
                                <Calendar className="w-3 h-3" />
                                Last updated: 2 hours ago
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Separator className="bg-gray-800" />

              {/* Sync Actions */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-400">
                  {selectedPage && selectedForm ? (
                    <p>Ready to sync leads from the selected form</p>
                  ) : (
                    <p>Select a page and form to continue</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSync}
                    disabled={!selectedPage || !selectedForm || isSyncing}
                    className="bg-white text-black hover:bg-gray-100"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Start Sync
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
