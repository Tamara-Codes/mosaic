import Header from "../components/header";
import Link from "next/link";
import * as React from "react"
import { Card, CardContent } from "../components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel"
import { workflows } from "../lib/workflows";


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
          <button className="px-6 py-3 bg-white text-black font-hand text-base font-semibold border-2 border-black rounded-2xl shadow-sm transition-all duration-200 ease-in-out hover:bg-[#2377d8] hover:text-white hover:shadow-lg hover:scale-105">
            Get Started For Free
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
          Realize the full potential of mosAIc&apos;s automated workflows
        </p>

        <Link href="/workflows">
          <button className="px-6 py-3 bg-white text-black font-hand text-base font-semibold border-2 border-black rounded-2xl shadow-sm transition-all duration-200 ease-in-out hover:bg-[#2377d8] hover:text-white hover:shadow-lg hover:scale-105">
            Browse Workflows
          </button>
        </Link>
      </section>

      <section id="pricing" className="flex flex-col items-center px-6 py-20 bg-white text-center border-t border-gray-200">
        <h2 className="text-4xl sm:text-5xl font-bold text-[#2377d8] font-hand mb-12">
          Pricing
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {[
          {
            title: "Free",
            price: "0 € / month",
            tagline: "For curious minds",
            features: ["1 active workflow", "Customer support", "1 month trial"],
            color: "bg-green-200",
          },
          {
            title: "Basic",
            price: "19 € / month",
            tagline: "Efficiency, unlocked",
            features: ["3 active workflows", "Customer support"],
            color: "bg-yellow-200",
          },
          {
            title: "Pro",
            price: "29 € / month",
            tagline: "Work smarter",
            features: ["5 active workflows", "Customer support"],
            color: "bg-purple-200",
          },
          {
            title: "God",
            price: "49 € / month",
            tagline: "Achieve Omnipotence",
            features: ["Infinite active workflows", "Customer support"],
            color: "bg-blue-200",
          },
        ].map((plan, index) => (
          <div
            key={index}
            className={`flex flex-col justify-between items-center rounded-2xl shadow-md p-8 ${plan.color} text-[#1b1b1b] border border-black/10 transition hover:shadow-xl`}
          >
            <h3 className="text-2xl font-bold font-hand tracking-wide mb-1">{plan.title}</h3>
            <p className="text-lg font-hand font-medium mb-1">{plan.price}</p>
            <p className="text-sm font-hand italic mb-4 opacity-90">{plan.tagline}</p>

            <ul className="text-sm font-hand mb-6 space-y-1 leading-relaxed">
              {plan.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>

            <Link href="/register">
              <button className="px-4 py-2 bg-white text-black font-hand text-sm font-semibold border border-black rounded-xl shadow-sm transition-all duration-200 ease-in-out hover:bg-[#f2f2f2] hover:shadow-md hover:scale-105">
                Get Started 
              </button>
            </Link>
          </div>
        ))}
      </div>
      </section>

    </>
  );
}