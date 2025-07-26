"use client";
import Image from "next/image";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/navigation-menu";
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const centerLinks = [
    { label: "About mosAIc", href: "/about" },
    { label: "Workflows", href: "/workflows" },
    { label: "Pricing", href: "#pricing" }, // Use hash only
  ];

  const handleNavClick = (href: string) => {
    if (href.startsWith("#") && pathname === "/") {
      const id = href.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push(href === "#pricing" ? "/#pricing" : href);
    }
  };

  return (
    <header className="bg-white text-black shadow-sm">
      <div className="w-full flex items-center justify-between px-12 py-6">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="mosAIc logo"
            width={100}
            height={40}
            priority
          />
        </Link>

        <div className="flex-1 flex justify-center">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-4">
              {centerLinks.map(({ label, href, scroll }) => (
                <NavigationMenuItem key={href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={href}
                      scroll={scroll ?? true}
                      className={navigationMenuTriggerStyle() + " text-xl"}
                    >
                      {label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex gap-4">
          <Link href="/login" className={navigationMenuTriggerStyle() + " text-xl"}>
            Log In
          </Link>
          <Link
            href="/register"
            className={
              navigationMenuTriggerStyle() +
              " bg-black text-xl text-white hover:bg-gray-800-white"
            }
          >
            Get started for free
          </Link>
        </div>
      </div>
    </header>
  );
}
