import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

interface AppearanceTabProps {
  themePreference: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({
  themePreference,
  onThemeChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance Settings</CardTitle>
        <CardDescription>Customize how the application looks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-4">Theme Preference</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ThemeOption
                title="Light Mode"
                icon={<Sun className="h-6 w-6" />}
                bgClass="bg-white text-black"
                isSelected={themePreference === 'light'}
                onClick={() => onThemeChange('light')}
              />
              
              <ThemeOption
                title="Dark Mode"
                icon={<Moon className="h-6 w-6" />}
                bgClass="bg-gray-900 text-white"
                isSelected={themePreference === 'dark'}
                onClick={() => onThemeChange('dark')}
              />
              
              <ThemeOption
                title="System Default"
                icon={
                  <>
                    <Sun className="h-6 w-6 text-black" />
                    <Moon className="h-6 w-6 text-white ml-2" />
                  </>
                }
                bgClass="bg-gradient-to-r from-white to-gray-900"
                isSelected={themePreference === 'system'}
                onClick={() => onThemeChange('system')}
              />
            </div>
          </div>
          <div className="pt-4">
            <Button>Save Appearance Settings</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ThemeOptionProps {
  title: string;
  icon: React.ReactNode;
  bgClass: string;
  isSelected: boolean;
  onClick: () => void;
}

const ThemeOption: React.FC<ThemeOptionProps> = ({
  title,
  icon,
  bgClass,
  isSelected,
  onClick
}) => {
  return (
    <div 
      className={`relative cursor-pointer rounded-lg p-4 border-2 ${isSelected ? 'border-primary' : 'border-muted'}`}
      onClick={onClick}
    >
      <div className={`flex items-center justify-center ${bgClass} rounded-md p-6 mb-2`}>
        {icon}
      </div>
      <p className="font-medium text-center">{title}</p>
    </div>
  );
};

export default AppearanceTab;
