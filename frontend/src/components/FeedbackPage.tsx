import { useEffect, useState } from 'react'
import { useApiClient } from '@/lib/apiHelpers'
import { MessageSquare, ThumbsUp, ThumbsDown, Utensils, Star } from 'lucide-react'

interface FeedbackEntry {
  id: string
  food_rating: boolean | null
  overall_rating: boolean | null
  comment: string | null
  created_at: string
}

function RatingBadge({ rating, label }: { rating: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      rating
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
      {rating ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
      {label}
    </span>
  )
}

export function FeedbackPage() {
  const apiClient = useApiClient()
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await apiClient.get('/feedback')
        setFeedback(response.data)
      } catch (err) {
        console.error('Failed to fetch feedback:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFeedback()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const foodRated = feedback.filter(f => f.food_rating !== null)
  const overallRated = feedback.filter(f => f.overall_rating !== null)
  const foodUpPct = foodRated.length > 0
    ? Math.round((foodRated.filter(f => f.food_rating === true).length / foodRated.length) * 100)
    : null
  const overallUpPct = overallRated.length > 0
    ? Math.round((overallRated.filter(f => f.overall_rating === true).length / overallRated.length) * 100)
    : null

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="flex gap-4">
        <section className="rounded-xl border bg-card overflow-hidden w-52">
          <div className="border-b px-4 py-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <MessageSquare className="h-3.5 w-3.5" />
            </div>
            <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Ukupno</p>
          </div>
          <div className="px-4 py-4">
            <p className="text-3xl font-bold tracking-tight">{feedback.length}</p>
            <p className="text-xs text-muted-foreground mt-1">recenzija</p>
          </div>
        </section>

        <section className="rounded-xl border bg-card overflow-hidden w-52">
          <div className="border-b px-4 py-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Utensils className="h-3.5 w-3.5" />
            </div>
            <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Hrana</p>
          </div>
          <div className="px-4 py-4">
            <p className="text-3xl font-bold tracking-tight">
              {foodUpPct !== null ? `${foodUpPct}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {foodRated.length > 0 ? `${foodRated.length} ocjena` : 'bez ocjena'}
            </p>
          </div>
        </section>

        <section className="rounded-xl border bg-card overflow-hidden w-52">
          <div className="border-b px-4 py-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Star className="h-3.5 w-3.5" />
            </div>
            <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Iskustvo</p>
          </div>
          <div className="px-4 py-4">
            <p className="text-3xl font-bold tracking-tight">
              {overallUpPct !== null ? `${overallUpPct}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {overallRated.length > 0 ? `${overallRated.length} ocjena` : 'bez ocjena'}
            </p>
          </div>
        </section>
      </div>

      {/* Feedback list */}
      <div className="flex gap-6 items-start">
      <section className="rounded-xl border bg-card overflow-hidden max-w-2xl flex-1">
        <div className="border-b px-6 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold">Sve recenzije</h3>
            <p className="text-sm text-muted-foreground">Najnovije prikazane prvo</p>
          </div>
        </div>

        {feedback.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Još nema recenzija</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Recenzije će se pojaviti kada gosti ostave ocjenu na vašem jelovniku.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {feedback.map(entry => (
              <div key={entry.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap gap-2">
                    {entry.food_rating !== null && (
                      <RatingBadge rating={entry.food_rating} label="Hrana" />
                    )}
                    {entry.overall_rating !== null && (
                      <RatingBadge rating={entry.overall_rating} label="Iskustvo" />
                    )}
                    {entry.food_rating === null && entry.overall_rating === null && (
                      <span className="text-xs text-muted-foreground italic">Bez ocjene</span>
                    )}
                  </div>
                  {entry.comment && (
                    <p className="text-sm text-foreground leading-relaxed">
                      "{entry.comment}"
                    </p>
                  )}
                </div>
                <time className="text-xs text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
                  {new Date(entry.created_at).toLocaleDateString('hr-HR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Right column */}
      <div className="w-64 shrink-0 space-y-4">
        <section className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b px-4 py-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <Star className="h-3.5 w-3.5" />
            </div>
            <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Analitika</p>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div>
              <p className="text-sm font-medium">Skeniranja QR koda</p>
              <p className="text-xs text-muted-foreground mt-0.5">Uskoro dostupno</p>
            </div>
            <div>
              <p className="text-sm font-medium">Pregledi jelovnika</p>
              <p className="text-xs text-muted-foreground mt-0.5">Uskoro dostupno</p>
            </div>
            <div>
              <p className="text-sm font-medium">Jezici posjetitelja</p>
              <p className="text-xs text-muted-foreground mt-0.5">Uskoro dostupno</p>
            </div>
          </div>
        </section>
      </div>
      </div>
    </div>
  )
}
