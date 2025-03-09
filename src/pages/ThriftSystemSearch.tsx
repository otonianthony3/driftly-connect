import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export interface ThriftSystemSearchFilters {
  name?: string;
}

interface ThriftSystemSearchProps {
  onViewSystem?: (systemId: string) => void;
  onJoinSystem?: (systemId: string) => void;
}

type ThriftSuggestion = {
  id: string;
  name: string;
};

const ThriftSystemSearch: React.FC<ThriftSystemSearchProps> = ({
  onViewSystem,
  onJoinSystem,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch thrift systems from Supabase
  const { data: thriftSystems = [] } = useQuery({
    queryKey: ["thriftSystems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thrift_systems")
        .select("id, name");

      if (error) throw error;
      return data || [];
    },
  });

  // Function to get the visible thrift systems (only 2 at a time)
  const getVisibleItems = () => {
    if (thriftSystems.length < 2) return thriftSystems;

    return [
      thriftSystems[currentIndex % thriftSystems.length],
      thriftSystems[(currentIndex + 1) % thriftSystems.length],
    ];
  };

  // Auto-scroll function for infinite scrolling
  useEffect(() => {
    if (thriftSystems.length < 2) return;

    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % thriftSystems.length);
      }, 3000); // Scroll every 3 seconds
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [thriftSystems.length, isPaused]);

  // Pause/resume scrolling on hover/touch
  const handleInteraction = (pause: boolean) => {
    setIsPaused(pause);
    if (pause && intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <div
      className="relative w-full max-w-md"
      onMouseEnter={() => handleInteraction(true)} // Pause on hover (desktop)
      onMouseLeave={() => handleInteraction(false)} // Resume when mouse leaves
      onTouchStart={() => handleInteraction(true)} // Pause on touch-hold (mobile)
      onTouchEnd={() => handleInteraction(false)} // Resume on touch release
    >
      <h3 className="text-lg font-semibold mb-2">Thrift Systems</h3>

      <div className="overflow-hidden h-32">
        {getVisibleItems().map((item) => (
          <div key={item.id} className="p-3 border-b flex items-center justify-between">
            <span>{item.name}</span>
            <div className="flex gap-2 ml-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onViewSystem && onViewSystem(item.id)}
              >
                View
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onJoinSystem && onJoinSystem(item.id)}
              >
                Join
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThriftSystemSearch;