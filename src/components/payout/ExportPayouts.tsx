import React from "react";
import { Button } from "@/components/ui/button";

interface ExportPayoutsProps {
  onExport: () => Promise<void> | void;
  isExporting: boolean;
  disabled: boolean;
  children: React.ReactNode;
}

const ExportPayouts: React.FC<ExportPayoutsProps> = ({
  onExport,
  isExporting,
  disabled,
  children,
}) => {
  return (
    <Button onClick={onExport} disabled={disabled || isExporting}>
      {children}
    </Button>
  );
};

export default ExportPayouts;