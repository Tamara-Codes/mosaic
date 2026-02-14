import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type Card = {
  title: string;
  description: string;
  icon?: string;
  lucideIcon?: LucideIcon;
};

export const FocusCard = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
  }: {
    card: Card;
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
  }) => (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "group rounded-xl relative overflow-hidden h-48 md:h-56 w-full transition-all duration-300 ease-out cursor-pointer border",
        hovered === index
          ? "border-orange-500/60 bg-zinc-800/70 shadow-[0_0_25px_-5px_rgba(249,115,22,0.3)]"
          : "border-white/10 bg-zinc-900/50",
        hovered !== null && hovered !== index && "blur-sm scale-[0.98]"
      )}
    >
      {/* Top accent bar */}
      <div
        className={cn(
          "absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 to-orange-400 transition-opacity duration-300",
          hovered === index ? "opacity-100" : "opacity-40"
        )}
      />

      <div className="absolute inset-0 flex flex-col p-6 pt-7">
        {/* Icon */}
        {card.lucideIcon && (
          <div
            className={cn(
              "mb-3 transition-all duration-300",
              hovered === index
                ? "opacity-0 -translate-y-2"
                : "opacity-100 translate-y-0"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center">
              <card.lucideIcon className="w-5 h-5 text-orange-400" />
            </div>
          </div>
        )}

        {/* Title - visible by default, hidden on hover */}
        <h3
          className={cn(
            "text-base md:text-lg font-semibold text-white leading-snug transition-all duration-300",
            hovered === index
              ? "opacity-0 -translate-y-2"
              : "opacity-100 translate-y-0"
          )}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {card.title}
        </h3>

        {/* Description - hidden by default, visible on hover */}
        <p
          className={cn(
            "text-sm text-zinc-300 leading-relaxed transition-all duration-300 absolute inset-x-0 px-6 top-7",
            hovered === index
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-3"
          )}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {card.description}
        </p>
      </div>
    </div>
  )
);

FocusCard.displayName = "FocusCard";

export function FocusCards({ cards }: { cards: Card[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
      {cards.map((card, index) => (
        <FocusCard
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
        />
      ))}
    </div>
  );
}
