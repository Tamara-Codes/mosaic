import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useApiClient } from '@/lib/apiHelpers'

export function QRCodePage() {
  const apiClient = useApiClient()
  const [qrData, setQrData] = useState<{ qr_code: string; menu_url: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQRCode()
  }, [])

  const loadQRCode = async () => {
    try {
      const response = await apiClient.get('/qr-code')
      const data = response.data
      setQrData(data)
      setLoading(false)
    } catch (error: any) {
      console.error('Failed to load QR code:', error)
      setLoading(false)
      // Show error message
      if (error?.response?.status === 404) {
        // Restaurant not found
      } else {
        // Other error
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Učitavanje...</div>
      </div>
    )
  }

  if (!qrData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">Greška pri generiranju QR koda</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>QR kod za jelovnik</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center p-4 bg-muted rounded-lg">
            <img
              src={`data:image/png;base64,${qrData.qr_code}`}
              alt="QR Code"
              className="w-full max-w-xs"
            />
          </div>
          <div className="p-4 bg-muted rounded-lg break-all text-sm">
            {qrData.menu_url}
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.print()}
          >
            Ispis QR Koda
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

