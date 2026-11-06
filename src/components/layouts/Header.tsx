import { appConfig } from "@/config/app";
import {
  CassetteTapeIcon,
  CoffeeIcon,
  LecternIcon,
  MenuIcon,
  PaletteIcon,
} from "lucide-react";
import { useTour } from "@/pages/machine/Tour";
import { useTheme } from "@/hooks/useTheme";
import { ModeToggle } from "../mode-toggle";
import { Button, buttonVariants } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SUPPORT_URL = "https://buymeacoffee.com/lachlanmacphee";
const linkClass = "font-medium underline underline-offset-4";

export function Header() {
  const { startTour } = useTour();
  const { theme, setTheme } = useTheme();

  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur">
      <div className="grid h-14 w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-6">
        <div className="flex items-center space-x-2 justify-self-start">
          <CassetteTapeIcon />
          {/* Just the icon on small screens */}
          <span className="hidden font-bold sm:inline">{appConfig.name}</span>
        </div>
        {/* The two sentences are kept whole, so any wrap happens after the full stop */}
        <p className="text-center text-xs leading-snug text-muted-foreground sm:text-sm">
          <span className="inline-block">
            Built by{" "}
            <a
              href={appConfig.author.url}
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              {appConfig.author.name}
            </a>
            .
          </span>{" "}
          <span className="inline-block">
            Source code on{" "}
            <a
              href={appConfig.github.url}
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              GitHub
            </a>
            .
          </span>
        </p>
        {/* Room for the buttons: show them directly */}
        <div className="hidden items-center gap-2 justify-self-end sm:flex">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  data-tour="tour-menu"
                  aria-label="Take the tour"
                  onClick={startTour}
                >
                  <LecternIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Take the tour</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={SUPPORT_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Support my work"
                  className={buttonVariants({ variant: "ghost", size: "icon" })}
                >
                  <CoffeeIcon />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Help support my work</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ModeToggle />
        </div>
        {/* Small screens: the same items in a menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="justify-self-end sm:hidden"
              data-tour="tour-menu"
              aria-label="Menu"
            >
              <MenuIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer" onSelect={startTour}>
              <LecternIcon className="mr-2 h-4 w-4" />
              Take the tour
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noreferrer"
              >
                <CoffeeIcon className="mr-2 h-4 w-4" />
                Support my work
              </a>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                <PaletteIcon className="mr-2 h-4 w-4" />
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(value) =>
                    setTheme(value as "light" | "dark" | "system")
                  }
                >
                  <DropdownMenuRadioItem value="light">
                    Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    Dark
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    System
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
