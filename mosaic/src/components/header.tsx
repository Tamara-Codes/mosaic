import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/navigation-menu";

export default function Header() {
  return (
    <header className="bg-[#0f172a] text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Left: Logo */}
        <div className="text-2xl font-semibold tracking-wide">mosAIc</div>

        {/* Center: Docs 1, 2, 3 */}
        <NavigationMenu>
          <NavigationMenuList className="flex gap-6">
            {["About mosAIc", "Workflows", "Prices"].map((label, i) => (
              <NavigationMenuItem key={i}>
                <NavigationMenuLink
                  href="#"
                  className="text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
                >
                  {label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right: Docs 4, Docs 5 */}
        <div className="flex gap-4">
          {["Log In", "Get started for free"].map((label, i) => (
            <a
              key={i}
              href="#"
              className="text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
