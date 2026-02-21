import { useState, useEffect } from 'react'
import { type Analytics } from '@/lib/api'
import { useApiClient } from '@/lib/apiHelpers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Utensils, Tag, CheckCircle, XCircle, QrCode, Globe, Smartphone, Monitor, Tablet } from 'lucide-react'

export function DashboardOverview() {
  const apiClient = useApiClient()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const response = await apiClient.get('/analytics')
      const data = response.data
      setAnalytics(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Učitavanje...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">Greška pri učitavanju podataka</div>
      </div>
    )
  }

  const deviceIcon = (device: string) => {
    if (device === 'mobile') return <Smartphone className="h-4 w-4 text-muted-foreground" />
    if (device === 'tablet') return <Tablet className="h-4 w-4 text-muted-foreground" />
    return <Monitor className="h-4 w-4 text-muted-foreground" />
  }

  const deviceLabel: Record<string, string> = {
    mobile: 'Mobitel',
    tablet: 'Tablet',
    desktop: 'Računalo',
  }

  // Sort daily views for chart display (last 30 days, filled with 0 for missing days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })
  const dailyMax = Math.max(1, ...last30Days.map(d => analytics.daily_views?.[d] ?? 0))

  const allergenLabels: Record<string, string> = {
    vegetarian: 'Vegetarijansko',
    vegan: 'Vegansko',
    gluten: 'Gluten',
    dairy: 'Mliječni proizvodi',
    nuts: 'Orašasti plodovi',
    fish: 'Riba',
    shellfish: 'Školjke',
    eggs: 'Jaja',
    spicy: 'Ljuto',
  }

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno Stavki</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_items}</div>
            <p className="text-xs text-muted-foreground">
              Stavki u meniju
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dostupno</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.available_items}</div>
            <p className="text-xs text-muted-foreground">
              Dostupnih danas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nedostupno</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.unavailable_items}</div>
            <p className="text-xs text-muted-foreground">
              Trenutno nedostupno
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategorije</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_categories}</div>
            <p className="text-xs text-muted-foreground">
              Različitih kategorija
            </p>
          </CardContent>
        </Card>
      </div>

      {/* View Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno Otvaranja</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_views ?? 0}</div>
            <p className="text-xs text-muted-foreground">Sva vremena</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Otvaranja (30 dana)</CardTitle>
            <QrCode className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.views_last_30_days ?? 0}</div>
            <p className="text-xs text-muted-foreground">Zadnjih 30 dana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jezici</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(analytics.language_breakdown ?? {}).length}</div>
            <p className="text-xs text-muted-foreground">Različitih jezika</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Views Chart (last 30 days) */}
      {analytics.total_views > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dnevna Otvaranja</CardTitle>
            <CardDescription>Zadnjih 30 dana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-px h-24">
              {last30Days.map(day => {
                const count = analytics.daily_views?.[day] ?? 0
                const height = Math.round((count / dailyMax) * 100)
                return (
                  <div key={day} className="flex-1 flex flex-col items-center group relative">
                    <div
                      className="w-full bg-primary/70 hover:bg-primary rounded-sm transition-colors"
                      style={{ height: `${Math.max(height, count > 0 ? 4 : 0)}%` }}
                    />
                    {count > 0 && (
                      <span className="absolute -top-5 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap">
                        {count}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>{last30Days[0]}</span>
              <span>{last30Days[29]}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Language & Device Breakdown */}
      {analytics.total_views > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Jezici Korisnika</CardTitle>
              <CardDescription>Kojim jezikom gledaju meni</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.language_breakdown ?? {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([lang, count]) => {
                    const pct = Math.round((count / (analytics.total_views || 1)) * 100)
                    return (
                      <div key={lang} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium uppercase">{lang}</span>
                          <span className="text-muted-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uređaji</CardTitle>
              <CardDescription>S čega gledaju meni</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.device_breakdown ?? {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([device, count]) => {
                    const pct = Math.round((count / (analytics.total_views || 1)) * 100)
                    return (
                      <div key={device} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {deviceIcon(device)}
                          <span className="text-sm font-medium">{deviceLabel[device] ?? device}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Categories Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Raspodjela po Kategorijama</CardTitle>
          <CardDescription>
            Broj stavki u svakoj kategoriji
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(analytics.categories).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="font-medium">{category}</span>
                <span className="text-sm text-muted-foreground">{count} stavki</span>
              </div>
            ))}
            {Object.keys(analytics.categories).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nema kategorija
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Allergen Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Alergeni i Posebne Opcije</CardTitle>
          <CardDescription>
            Pregled alergena i posebnih opcija u meniju
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(analytics.allergen_counts).map(([key, count]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm font-medium">{allergenLabels[key]}</span>
                <span className="text-sm font-bold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

