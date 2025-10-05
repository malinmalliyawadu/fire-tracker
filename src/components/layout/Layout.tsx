import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { useState } from "react";
import {
  Flame,
  TrendingUp,
  Settings as SettingsIcon,
  DollarSign,
  BarChart3,
  Trophy,
} from "lucide-react";
import { ThemeSwitch } from "@/components/theme-switch";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({
  children,
  activeTab,
  onTabChange,
}: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: TrendingUp, color: "from-blue-500 to-cyan-500" },
    { key: "assets", label: "Assets & Liabilities", icon: DollarSign, color: "from-green-500 to-emerald-500" },
    { key: "charts", label: "Charts & Analytics", icon: BarChart3, color: "from-purple-500 to-pink-500" },
    { key: "milestones", label: "Milestones", icon: Trophy, color: "from-orange-500 to-red-500" },
    { key: "settings", label: "Settings", icon: SettingsIcon, color: "from-gray-500 to-slate-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg"
        onMenuOpenChange={setIsMenuOpen}
        maxWidth="full"
      >
        <NavbarContent>
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden"
          />
          <NavbarBrand>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 mr-3">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-xl text-gray-900 dark:text-white">
                FIRE Tracker
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Financial Independence Tracker
              </p>
            </div>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-2" justify="center">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;

            return (
              <NavbarItem key={item.key}>
                <Button
                  className={`
                    relative overflow-hidden transition-all duration-300 hover:scale-105
                    ${isActive
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                      : 'bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50'
                    }
                  `}
                  startContent={
                    <div className={`flex items-center justify-center w-5 h-5 ${isActive ? '' : `bg-gradient-to-r ${item.color} rounded`}`}>
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-white'}`} />
                    </div>
                  }
                  onPress={() => onTabChange(item.key)}
                  size="md"
                >
                  <span className="font-medium">{item.label}</span>
                </Button>
              </NavbarItem>
            );
          })}
        </NavbarContent>

        {/* Theme Toggle - Desktop */}
        <NavbarContent className="hidden sm:flex" justify="end">
          <NavbarItem>
            <ThemeSwitch />
          </NavbarItem>
        </NavbarContent>

        <NavbarMenu className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col gap-2 pt-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;

              return (
                <NavbarMenuItem key={item.key}>
                  <Button
                    className={`
                      w-full justify-start transition-all duration-300
                      ${isActive
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                        : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }
                    `}
                    startContent={
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? 'bg-white/20' : `bg-gradient-to-r ${item.color}`}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    }
                    onPress={() => {
                      onTabChange(item.key);
                      setIsMenuOpen(false);
                    }}
                    size="lg"
                  >
                    <span className="font-medium">{item.label}</span>
                  </Button>
                </NavbarMenuItem>
              );
            })}

            {/* Theme Toggle - Mobile */}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
              <ThemeSwitch showLabel className="w-full" />
            </div>
          </div>
        </NavbarMenu>
      </Navbar>

      <main className="relative z-0">{children}</main>
    </div>
  );
}
