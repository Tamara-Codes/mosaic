import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

export function BentoGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function BentoCard({
  Icon,
  image,
  title,
  description,
  className,
}: {
  Icon: LucideIcon
  image?: string
  title: string
  description: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.2)] hover:border-orange-500/30 overflow-hidden",
        className,
      )}
    >
      {/* Visual area at the top — image or icon */}
      {image ? (
        <div className="overflow-hidden flex-1">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center bg-gradient-to-br from-orange-500/10 to-orange-600/5 py-10 sm:py-14">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/15 border border-orange-500/20">
            <Icon className="h-8 w-8 text-orange-400" />
          </div>
        </div>
      )}

      {/* Text content below */}
      <div className="p-5 sm:p-6 mt-auto">
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
      </div>
    </div>
  )
}
