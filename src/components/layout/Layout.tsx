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
  Target,
  Settings as SettingsIcon,
  PlusCircle,
  BarChart3,
} from "lucide-react";

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
    { key: "dashboard", label: "Dashboard", icon: TrendingUp },
    { key: "assets", label: "Assets", icon: PlusCircle },
    { key: "charts", label: "Charts", icon: BarChart3 },
    { key: "milestones", label: "Milestones", icon: Target },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        onMenuOpenChange={setIsMenuOpen}
      >
        <NavbarContent>
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden"
          />
          <NavbarBrand>
            <Flame className="h-8 w-8 text-orange-500 mr-2" />
            <p className="font-bold text-xl text-gray-900 dark:text-white">
              FIRE Tracker
            </p>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavbarItem key={item.key}>
                <Button
                  color={activeTab === item.key ? "primary" : "default"}
                  startContent={<Icon className="h-4 w-4" />}
                  variant={activeTab === item.key ? "solid" : "light"}
                  onPress={() => onTabChange(item.key)}
                >
                  {item.label}
                </Button>
              </NavbarItem>
            );
          })}
        </NavbarContent>

        <NavbarMenu>
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavbarMenuItem key={item.key}>
                <Button
                  className="w-full justify-start"
                  color={activeTab === item.key ? "primary" : "default"}
                  startContent={<Icon className="h-4 w-4" />}
                  variant={activeTab === item.key ? "solid" : "light"}
                  onPress={() => {
                    onTabChange(item.key);
                    setIsMenuOpen(false);
                  }}
                >
                  {item.label}
                </Button>
              </NavbarMenuItem>
            );
          })}
        </NavbarMenu>
      </Navbar>

      <main>{children}</main>
    </div>
  );
}
