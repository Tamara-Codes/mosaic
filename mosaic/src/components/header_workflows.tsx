import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/navigation-menu";

export default function Header() {
  const centerLinks = [
    { label: "Home", href: "/" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (
    <header className="bg-white text-black shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="text-2xl font-semibold tracking-wide">mosAIc</div>

        <div className="flex-1 flex justify-center">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-4">
              {centerLinks.map(({ label, href }) => (
                <NavigationMenuItem key={href}>
                  <NavigationMenuLink asChild>
                    <Link href={href} className={navigationMenuTriggerStyle() + " text-xl"}>
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
            className={navigationMenuTriggerStyle() + " bg-black text-xl text-white hover:bg-gray-800-white"}
          >
            Get started for free
          </Link>
        </div>
      </div>
    </header>
  );
}
