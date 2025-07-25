import Header from "@/components/header";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Header />

      <main className="flex flex-col min-h-[calc(100vh-64px)] items-center justify-center px-6 py-20 bg-white text-center">
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
    </>
  );
}