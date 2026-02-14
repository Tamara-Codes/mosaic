import React, { useState } from "react";
import { cn } from "@/lib/utils";

export type Card = {
  title: string;
  description: string;
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
        "rounded-xl relative overflow-hidden h-36 md:h-40 w-full transition-all duration-300 ease-out cursor-pointer bg-transparent border",
        hovered === index
          ? "border-orange-500/60"
          : "border-white/10",
        hovered !== null && hovered !== index && "blur-sm scale-[0.98]"
      )}
    >
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <h3
          className="text-base md:text-lg font-semibold text-white mb-1"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {card.title}
        </h3>
        <p
          className={cn(
            "text-xs md:text-sm text-zinc-400 leading-relaxed transition-all duration-300",
            hovered === index
              ? "opacity-100 max-h-40 translate-y-0"
              : "opacity-0 max-h-0 translate-y-2"
          )}
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
