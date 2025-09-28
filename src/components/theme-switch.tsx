import { FC, useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { useTheme } from "@heroui/use-theme";
import { Sun, Moon } from "lucide-react";

export interface ThemeSwitchProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({
  className = "",
  showLabel = false,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent Hydration Mismatch
  if (!isMounted) {
    return (
      <div className={`w-10 h-10 ${className}`} />
    );
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const isDark = theme === "dark";

  return (
    <Button
      isIconOnly={!showLabel}
      variant="light"
      className={`
        transition-all duration-300 hover:scale-105
        bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-700/80
        border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm
        ${className}
      `}
      onPress={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <div className="flex items-center gap-2">
        {isDark ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-blue-600" />
        )}
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isDark ? "Light" : "Dark"}
          </span>
        )}
      </div>
    </Button>
  );
};
