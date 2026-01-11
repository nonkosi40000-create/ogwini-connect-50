import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";

interface SchoolMapProps {
  className?: string;
}

// School location: Umlazi P99 Phambili Road
const SCHOOL_COORDINATES = {
  lng: 30.8918,
  lat: -29.9644,
};

const SchoolMap: React.FC<SchoolMapProps> = ({ className = "" }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || !token) return;

    try {
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [SCHOOL_COORDINATES.lng, SCHOOL_COORDINATES.lat],
        zoom: 15,
        pitch: 45,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Add marker for school location
      new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([SCHOOL_COORDINATES.lng, SCHOOL_COORDINATES.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            '<strong>Ogwini Comprehensive Technical High School</strong><br/>P99 Phambili Road, Umlazi'
          )
        )
        .addTo(map.current);

      setIsTokenSet(true);
      setError(null);
      
      // Save to localStorage for persistence
      localStorage.setItem('mapbox_token', token);
    } catch (err) {
      setError('Invalid Mapbox token. Please check and try again.');
      setIsTokenSet(false);
    }
  };

  useEffect(() => {
    // Check for saved token
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
      initializeMap(savedToken);
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  const handleSetToken = () => {
    if (mapboxToken.trim()) {
      initializeMap(mapboxToken.trim());
    }
  };

  const openInGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${SCHOOL_COORDINATES.lat},${SCHOOL_COORDINATES.lng}`,
      '_blank'
    );
  };

  if (!isTokenSet) {
    return (
      <div className={`bg-secondary/50 rounded-xl p-8 ${className}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground mb-2">School Location</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Ogwini Comprehensive Technical High School<br />
              P99 Phambili Road, Umlazi, KwaZulu-Natal
            </p>
          </div>
          
          <div className="max-w-md mx-auto space-y-3">
            <p className="text-xs text-muted-foreground">
              Enter your Mapbox public token to view the interactive map. 
              Get one free at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="pk.eyJ1IjoieW91ci10b2tlbi4uLiI
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSetToken} size="sm">
                Load Map
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <Button variant="outline" onClick={openInGoogleMaps} className="mt-4">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Google Maps
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-[400px]" />
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
        <p className="font-medium text-foreground text-sm">Ogwini Comprehensive Technical High School</p>
        <p className="text-xs text-muted-foreground">P99 Phambili Road, Umlazi</p>
        <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={openInGoogleMaps}>
          <ExternalLink className="w-3 h-3 mr-1" />
          Get Directions
        </Button>
      </div>
    </div>
  );
};

export default SchoolMap;
