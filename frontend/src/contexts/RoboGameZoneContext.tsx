import { createContext, useContext, useState, type ReactNode } from 'react';

interface RoboGameZoneContextType {
  isRoboGameZoneEnabled: boolean;
  setIsRoboGameZoneEnabled: (enabled: boolean) => void;
}

const RoboGameZoneContext = createContext<RoboGameZoneContextType | undefined>(undefined);

export function RoboGameZoneProvider({ children }: { children: ReactNode }) {
  const [isRoboGameZoneEnabled, setIsRoboGameZoneEnabled] = useState(false);

  return (
    <RoboGameZoneContext.Provider value={{ isRoboGameZoneEnabled, setIsRoboGameZoneEnabled }}>
      {children}
    </RoboGameZoneContext.Provider>
  );
}

export function useRoboGameZone() {
  const context = useContext(RoboGameZoneContext);
  if (context === undefined) {
    throw new Error('useRoboGameZone must be used within a RoboGameZoneProvider');
  }
  return context;
}

