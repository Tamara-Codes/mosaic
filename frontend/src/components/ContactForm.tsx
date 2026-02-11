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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useState } from "react"
import axios from "axios"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Ime mora imati barem 2 slova.",
  }),
  email: z.string().email({
    message: "Unesite valjanu email adresu.",
  }),
  message: z.string().min(10, {
    message: "Poruka mora imati barem 10 slova.",
  }),
})

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    
    try {
      // Create FormData for the API
      const formData = new FormData()
      formData.append('name', values.name)
      formData.append('email', values.email)
      formData.append('message', values.message)
      
      // Send to backend API
      const response = await axios.post('/api/contact', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      if (response.data.success) {
        toast.success("Poruka poslana!", {
          description: "Javit ćemo vam se uskoro.",
        })
        form.reset()
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      toast.error("Greška pri slanju poruke", {
        description: "Molimo pokušajte ponovno kasnije.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-zinc-900 border border-white/5 shadow-xl">
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Kontaktirajte nas</h3>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Ime</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Vaše ime" 
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="vas@email.com" 
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
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Poruka</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Kako vam možemo pomoći?" 
                    {...field} 
                    className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 min-h-[120px] focus:border-orange-500/50 focus:ring-orange-500/20 resize-none"
                  />
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
            {isSubmitting ? "Šalje se..." : "Pošalji poruku"}
          </Button>
        </form>
      </Form>
    </div>
  )
}

