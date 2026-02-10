import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const basicFeatures = [
    "AI prijevodi na 50+ jezika",
    "Instant ažuriranja",
    "Informacije o alergenima",
  ]

  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.83)
  }

  const getDisplayPrice = (monthlyPrice: number) => {
    if (billingCycle === 'monthly') {
      return monthlyPrice
    }
    return Math.round(getYearlyPrice(monthlyPrice) / 12)
  }

  return (
    <section className="py-24 bg-[#18181b] relative overflow-hidden" id="pricing">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-zinc-400 text-lg">
            Sve što vam treba za modernizaciju vašeg restorana u jednom paketu.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <Tabs defaultValue="monthly" className="w-[400px]" onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}>
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-white/10">
              <TabsTrigger value="monthly" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-zinc-400">
                Mjesečno
              </TabsTrigger>
              <TabsTrigger value="yearly" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-zinc-400 relative">
                Godišnje
                <span className="absolute -top-3 -right-3 bg-white text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-orange-200">
                  -17%
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Basic Plan */}
          <Card className="bg-zinc-900 border-white/10 p-8 relative overflow-hidden group hover:border-orange-500/50 transition-colors duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-[50px] -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-all duration-500" />
            
            <div className="relative z-10 mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
              <p className="text-zinc-400 text-sm">Za male restorane</p>
            </div>

            <div className="relative z-10 mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">
                  {getDisplayPrice(30)}€
                </span>
                <span className="text-zinc-500">/mj</span>
              </div>
              {billingCycle === 'yearly' && (
                <div className="text-xs text-orange-500 font-medium mt-1">
                  Naplaćeno {getYearlyPrice(30)}€ godišnje
                </div>
              )}
            </div>

            <div className="relative z-10 space-y-4 mb-8 min-h-[160px]">
              {basicFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-zinc-300">
                  <div className="h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-orange-500" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <Button 
              onClick={() => {
                const contactSection = document.getElementById('contact');
                contactSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative z-10 w-full bg-zinc-800 hover:bg-zinc-700 text-white py-6 text-lg transition-all duration-300 border border-white/10 hover:border-orange-500/30">
              <Sparkles className="mr-2 h-5 w-5" />
              Kontaktiraj nas
            </Button>
          </Card>

          {/* Pro Plan */}
          <Card className="bg-zinc-900 border-orange-500/30 p-8 relative overflow-hidden group hover:border-orange-500/50 transition-colors duration-300 md:ring-2 md:ring-orange-500/20">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[50px] -mr-16 -mt-16 group-hover:bg-orange-500/20 transition-all duration-500" />
            
            <div className="relative z-10 mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <p className="text-zinc-400 text-sm">Za restorane srednje veličine</p>
            </div>

            <div className="relative z-10 mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">
                  {getDisplayPrice(40)}€
                </span>
                <span className="text-zinc-500">/mj</span>
              </div>
              {billingCycle === 'yearly' && (
                <div className="text-xs text-orange-500 font-medium mt-1">
                  Naplaćeno {getYearlyPrice(40)}€ godišnje
                </div>
              )}
            </div>

            <div className="relative z-10 space-y-4 mb-8 min-h-[160px]">
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <span className="text-sm font-medium">Sve u Basic +</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <span className="text-sm">AI generacija slika jela</span>
              </div>
            </div>

            <Button 
              onClick={() => {
                const contactSection = document.getElementById('contact');
                contactSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative z-10 w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg shadow-[0_0_20px_rgba(249,115,22,0.2)] group-hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all duration-300">
              <Sparkles className="mr-2 h-5 w-5" />
              Kontaktiraj nas
            </Button>
          </Card>

          {/* Premium Plan */}
          <Card className="bg-zinc-900 border-white/10 p-8 relative overflow-hidden group hover:border-orange-500/50 transition-colors duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-[50px] -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-all duration-500" />
            
            <div className="relative z-10 mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <p className="text-zinc-400 text-sm">Za velike restorane</p>
            </div>

            <div className="relative z-10 mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">
                  {getDisplayPrice(45)}€
                </span>
                <span className="text-zinc-500">/mj</span>
              </div>
              {billingCycle === 'yearly' && (
                <div className="text-xs text-orange-500 font-medium mt-1">
                  Naplaćeno {getYearlyPrice(45)}€ godišnje
                </div>
              )}
            </div>

            <div className="relative z-10 space-y-4 mb-8 min-h-[160px]">
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <span className="text-sm font-medium">Sve u Pro +</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <span className="text-sm">AI chatbot</span>
              </div>
            </div>

            <Button 
              onClick={() => {
                const contactSection = document.getElementById('contact');
                contactSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative z-10 w-full bg-zinc-800 hover:bg-zinc-700 text-white py-6 text-lg transition-all duration-300 border border-white/10 hover:border-orange-500/30">
              <Sparkles className="mr-2 h-5 w-5" />
              Kontaktiraj nas
            </Button>
          </Card>
        </div>
      </div>
    </section>
  )
}

