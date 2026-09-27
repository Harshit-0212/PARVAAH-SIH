import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapSelectionHandlerProps {
  isDrawerOpen?: boolean;
}

export const MapSelectionHandler: React.FC<MapSelectionHandlerProps> = ({
  isDrawerOpen
}) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate Leaflet map size when drawer state changes or window resizes
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => clearTimeout(timer);
  }, [isDrawerOpen, map]);

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  return null;
};
