import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export default function ThemeToggle({ withMenu = true, size = "icon" }) {
  const { theme, resolvedTheme, toggle, setTheme, setSystem } = useTheme();

  const Icon = resolvedTheme === "dark" ? Moon : Sun;
  const label =
    theme === "system" ? `System (${resolvedTheme})` : resolvedTheme;

  if (!withMenu) {
    return (
      <Button variant="ghost" size={size} aria-label="Toggle theme" onClick={toggle}>
        <Icon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size} aria-label="Theme">
          <Icon className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline text-sm">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={setSystem}>
          <Laptop className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

