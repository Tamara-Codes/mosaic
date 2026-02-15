import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useState } from "react"
import axios from "axios"

const formSchema = z.object({
  restaurantName: z.string().min(2, {
    message: "Ime restorana mora imati barem 2 slova.",
  }),
  mobile: z.string().min(8, {
    message: "Unesite valjan broj mobitela.",
  }),
  location: z.string().min(2, {
    message: "Unesite lokaciju (grad).",
  }),
  menu: z.instanceof(File).optional(),
})

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      restaurantName: "",
      mobile: "",
      location: "",
      menu: undefined,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    
    try {
      // Create FormData for the API
      const formData = new FormData()
      formData.append('restaurantName', values.restaurantName)
      formData.append('mobile', values.mobile)
      formData.append('location', values.location)
      
      // Add menu file if provided
      if (selectedFile) {
        formData.append('menu', selectedFile)
      }
      
      // Send to backend API
      const response = await axios.post('/api/v1/contact', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      if (response.data.success) {
        toast.success("VIP zahtjev poslan!", {
          description: "Javit ćemo vam se uskoro.",
        })
        form.reset()
        setSelectedFile(null)
      } else {
        throw new Error('Failed to send VIP request')
      }
    } catch (error) {
      console.error('VIP form error:', error)
      toast.error("Greška pri slanju zahtjeva", {
        description: "Molimo pokušajte ponovno kasnije.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <h3 className="text-2xl font-bold text-white mb-6">Prijavi se za VIP status</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="restaurantName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Ime restorana</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ime restorana" 
                    {...field} 
                    className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-orange-500/20"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Vaš broj mobitela</FormLabel>
                <FormControl>
                  <Input 
                    type="tel"
                    placeholder="091 123 4567" 
                    {...field} 
                    className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-orange-500/20"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Lokacija</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Grad" 
                    {...field} 
                    className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-orange-500/20"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="menu"
            render={() => (
              <FormItem>
                <FormLabel className="text-zinc-300">Jelovnik (opcionalno)</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-lg cursor-pointer bg-black/30 hover:bg-black/50 hover:border-orange-500/30 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-2 text-sm text-zinc-400">
                          <span className="font-semibold text-orange-400">Kliknite za upload</span> ili povucite datoteku
                        </p>
                        <p className="text-xs text-zinc-500">PDF ili slika (JPG, PNG, WEBP)</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setSelectedFile(file)
                            form.setValue('menu', file)
                          } else {
                            setSelectedFile(null)
                            form.setValue('menu', undefined)
                          }
                        }}
                      />
                    </label>
                    {selectedFile && (
                      <div className="flex items-center gap-2 p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                        <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-zinc-300 flex-1 truncate">
                          {selectedFile.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null)
                            form.setValue('menu', undefined)
                          }}
                          className="text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Šalje se..." : "Pošalji VIP zahtjev"}
          </Button>
        </form>
      </Form>
    </div>
  )
}

