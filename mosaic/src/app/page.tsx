import Header from "@/components/header";
import Link from "next/link";
import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { workflows } from "@/components/workflows";


export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-col min-h-[calc(100vh-264px)] items-center justify-center px-6 py-20 bg-white text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-[#2377d8] font-hand mb-6 leading-tight">
          Smart pieces,<br />
          beautiful solutions
        </h1>

        <p className="text-xl sm:text-2xl text-black font-hand max-w-6xl sm:max-w-7xl w-full px-4 mb-8">
          mosAIc offers plug-and-play automation workflows tailored to your needs. <br />
          Whether you’re managing personal tasks or running a business, <br />
          mosAIc takes the busywork off your hands so you can focus on what really matters.
        </p>

        <Link href="/register">
          <button className="mt-4 px-6 py-3 rounded-xl border-2 border-[#2377d8] text-[#1b1b1b] font-hand text-lg hover:bg-[#e9f2ff] transition">
            Get started for free
          </button>
        </Link>
      </main>

      <section className="flex flex-col items-center px-6 py-20 bg-white text-center border-t border-gray-200">
        <h2 className="text-4xl sm:text-5xl font-bold text-[#2377d8] font-hand mb-10">
          Unlock Effortless Automation with mosAIc
        </h2>

        <div className="w-full max-w-4xl mb-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {workflows.map((workflow, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <Link href={workflow.href}>
                    <Card className={`h-full ${workflow.color} transition hover:shadow-lg`}>
                      <CardContent className="flex flex-col justify-center items-center text-center h-full p-6 gap-3">
                        <h3 className="text-xl font-bold font-hand">{workflow.title}</h3>
                        <p className="text-sm font-hand">{workflow.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        <p className="text-lg sm:text-xl text-black font-hand mb-8">
          Realize the full potential of mosAIc's automated workflows
        </p>

        <Link href="/workflows">
          <button className="px-6 py-3 rounded-xl border-2 border-[#2377d8] text-[#1b1b1b] font-hand text-lg hover:bg-[#e9f2ff] transition">
            Browse Workflows
          </button>
        </Link>
      </section>
    </>
  );
}