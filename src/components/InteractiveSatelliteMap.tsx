import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Supplier } from '../types';
import { Compass, Orbit, ZoomIn, ZoomOut, Check, Navigation, Info } from 'lucide-react';

interface InteractiveSatelliteMapProps {
  suppliers: Supplier[];
  selectedSupplierId: string;
  onSelectSupplier: (id: string) => void;
  divergenceThreshold: number;
}

const RotterdamLatLng: [number, number] = [51.9244, 4.4777];

export default function InteractiveSatelliteMap({
  suppliers,
  selectedSupplierId,
  onSelectSupplier,
  divergenceThreshold
}: InteractiveSatelliteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.CircleMarker }>({});
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'light' | 'dark'>('satellite');
  // Remembered base-map theme, applied when leaving Satellite for Standard.
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const isFirstRender = useRef(true);

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: RotterdamLatLng,
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
    });

    // 1. Satellite Imagery + Labels
    const baseLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
    });

    const labelsLayer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      opacity: 0.75,
    });

    (map as any).satelliteLayerGroup = L.layerGroup([baseLayer, labelsLayer]).addTo(map);

    // 2. Light Voyager (Premium color-balanced light topo theme)
    const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    });
    (map as any).lightLayer = lightLayer;

    // 3. Tactical Dark (Ultra-premium dark slate theme)
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    });
    (map as any).darkLayer = darkLayer;

    // Draw Rotterdam Port marker
    const rotterdamIcon = L.divIcon({
      html: `<div class="w-4 h-4 bg-sky-500 rounded-full border-2 border-white ring-4 ring-sky-500/20 animate-pulse"></div>`,
      className: 'custom-rotterdam-marker',
      iconSize: [16, 16],
    });
    L.marker(RotterdamLatLng, { icon: rotterdamIcon }).addTo(map).bindTooltip('Rotterdam HQ Port', { permanent: false, direction: 'top' });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const [cloudPhase, setCloudPhase] = useState<'none' | 'condense' | 'dissolve'>('none');

  // Handle flyTo when active supplier changes with high-altitude orbital cloud transition
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const s = suppliers.find(supplier => supplier.id === selectedSupplierId);
    if (s) {
      // 1. Instantly start condensation (clouds roll in)
      setCloudPhase('condense');

      // 2. FlyTo after clouds cover target (approx. 350ms)
      const flyTimer = setTimeout(() => {
        map.flyTo([s.lat, s.lon], 13, {
          animate: true,
          duration: 2.2,
        });
      }, 350);

      // 3. Dissolve clouds as we hit ground truth target (at 1800ms during flyTo arc descent)
      const dissolveTimer = setTimeout(() => {
        setCloudPhase('dissolve');
      }, 1600);

      // 4. Clean up transition state completely
      const clearTimer = setTimeout(() => {
        setCloudPhase('none');
      }, 2700);

      return () => {
        clearTimeout(flyTimer);
        clearTimeout(dissolveTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [selectedSupplierId, suppliers]);

  // Handle adding/updating suppliers & custom markers & routes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean old markers
    Object.values(markersRef.current).forEach(m => {
      if (m) map.removeLayer(m);
    });
    markersRef.current = {};

    // Remove old polylines
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Polyline && !(layer === (map as any).activeRouteLine)) {
        map.removeLayer(layer);
      }
    });

    suppliers.forEach(s => {
      const isClean = s.selfReported <= s.benchmark;
      const isDirty = s.selfReported > s.benchmark * 1.5;
      
      const dotColor = isClean 
        ? '#10B981' // emerald
        : isDirty 
          ? '#EF4444' // red
          : '#F59E0B'; // amber

      const isCurrent = s.id === selectedSupplierId;

      // Marker — white outline on every dot so colours stay legible over satellite imagery
      const marker = L.circleMarker([s.lat, s.lon], {
        radius: isCurrent ? 11 : 8,
        color: '#FFFFFF',
        weight: isCurrent ? 3 : 2,
        fillColor: dotColor,
        fillOpacity: isCurrent ? 1 : 0.92,
      }).addTo(map);

      // Tooltip
      marker.bindTooltip(`
        <div class="font-sans text-[11px] p-1 text-left bg-stone-900 border border-stone-850 text-white rounded">
          <strong class="block text-[11px]">${s.name}</strong>
          <span class="text-[9px] text-stone-300 block">${s.facilityName}</span>
          <span class="text-[9px] hover:text-[#10B981] mt-1 block">Value: ${s.selfReported.toFixed(2)} t/t CO₂</span>
        </div>
      `, {
        direction: 'top',
        className: 'custom-leaflet-tooltip',
        opacity: 0.95
      });

      marker.on('click', () => {
        onSelectSupplier(s.id);
      });

      markersRef.current[s.id] = marker;
    });

  }, [suppliers, selectedSupplierId]);

  // Handle active selected supply line polyroute
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if ((map as any).activeRouteLine) {
      map.removeLayer((map as any).activeRouteLine);
    }

    const s = suppliers.find(supplier => supplier.id === selectedSupplierId);
    if (s) {
      const activeLine = L.polyline([[s.lat, s.lon], RotterdamLatLng], {
        color: '#10B981',
        weight: 2,
        dashArray: '6, 8',
        opacity: 0.8,
      }).addTo(map);

      (map as any).activeRouteLine = activeLine;
    }
  }, [selectedSupplierId, suppliers]);

  // Mode Layer Switcher
  const toggleMapLayer = (type: 'satellite' | 'light' | 'dark') => {
    const map = mapRef.current;
    if (!map) return;

    if (map.hasLayer((map as any).satelliteLayerGroup)) {
      map.removeLayer((map as any).satelliteLayerGroup);
    }
    if (map.hasLayer((map as any).lightLayer)) {
      map.removeLayer((map as any).lightLayer);
    }
    if (map.hasLayer((map as any).darkLayer)) {
      map.removeLayer((map as any).darkLayer);
    }

    if (type === 'satellite') {
      (map as any).satelliteLayerGroup.addTo(map);
    } else if (type === 'light') {
      (map as any).lightLayer.addTo(map);
    } else if (type === 'dark') {
      (map as any).darkLayer.addTo(map);
    }

    setActiveLayer(type);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const map = mapRef.current;
    if (!map) return;
    if (direction === 'in') map.zoomIn();
    else map.zoomOut();
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-stone-200/40 bg-zinc-950 shadow-md">

      {/* Legibility scrim — keeps the HUD + controls readable over busy satellite imagery */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent z-30 pointer-events-none" />

      {/* Target scanning hud / overlay */}
      <div className="absolute top-4 left-4 z-40 bg-stone-900/90 backdrop-blur-md border border-stone-850 px-3 py-1.5 rounded-xl text-left shadow-lg text-white pointer-events-none">
        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-semibold">
          <Orbit className="w-3.5 h-3.5 animate-spin-slow" />
          <span>REAL-TIME EARTH INTERACTION ACTIVE</span>
        </div>
        <p className="font-serif text-[12px] font-medium leading-none text-stone-100 mt-1">
          {selectedSupplier.name}
        </p>
        <span className="font-mono text-[8px] text-stone-400 block mt-0.5">
          COORDINATES: {selectedSupplier.lat.toFixed(4)}°N, {selectedSupplier.lon.toFixed(4)}°E
        </span>
      </div>

      {/* Unified map-style control: ONE primary toggle (Standard ↔ Satellite),
          with the Light/Dark sub-toggle shown ONLY in Standard mode. */}
      <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-1.5">
        <div className="bg-stone-950/95 backdrop-blur-md border border-stone-700/70 p-1 rounded-xl flex gap-1 shadow-lg">
          <button
            onClick={() => toggleMapLayer(theme)}
            className={`px-3 py-1 text-[9px] font-semibold font-mono rounded-lg transition-all cursor-pointer ${
              activeLayer !== 'satellite'
                ? 'bg-[#2E4A3F] text-emerald-400 border border-emerald-500/25'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => toggleMapLayer('satellite')}
            className={`px-3 py-1 text-[9px] font-semibold font-mono rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeLayer === 'satellite'
                ? 'bg-[#2E4A3F] text-emerald-400 border border-emerald-500/25'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Orbit className="w-3 h-3" /> Satellite
          </button>
        </div>

        {activeLayer !== 'satellite' && (
          <div className="bg-stone-950/95 backdrop-blur-md border border-stone-700/70 p-1 rounded-xl flex gap-1 shadow-lg animate-fade-in">
            <button
              onClick={() => { setTheme('light'); toggleMapLayer('light'); }}
              className={`px-3 py-1 text-[9px] font-semibold font-mono rounded-lg transition-all cursor-pointer ${
                activeLayer === 'light' ? 'bg-white text-stone-900' : 'text-stone-300 hover:text-white'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => { setTheme('dark'); toggleMapLayer('dark'); }}
              className={`px-3 py-1 text-[9px] font-semibold font-mono rounded-lg transition-all cursor-pointer ${
                activeLayer === 'dark' ? 'bg-stone-700 text-white' : 'text-stone-300 hover:text-white'
              }`}
            >
              Dark
            </button>
          </div>
        )}
      </div>

      {/* Map zooming keys right lower corner */}
      <div className="absolute bottom-4 right-4 z-40 flex flex-col gap-1">
        <button
          onClick={() => handleZoom('in')}
          className="w-8 h-8 rounded-lg bg-stone-900/90 border border-stone-800 text-stone-200 hover:text-white flex items-center justify-center cursor-pointer hover:bg-stone-800 transition-all shadow-md"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="w-8 h-8 rounded-lg bg-stone-900/90 border border-stone-800 text-stone-200 hover:text-white flex items-center justify-center cursor-pointer hover:bg-stone-800 transition-all shadow-md"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Leaflet container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[370px] z-10" 
      />

      {/* "In the Clouds" Cinematic Transition Overlay */}
      {cloudPhase !== 'none' && (
        <div 
          className={`absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center transition-all duration-[600ms] ease-out ${
            cloudPhase === 'condense' ? 'opacity-100 scale-100' : 'opacity-0 scale-105 filter blur-xs'
          }`}
          style={{
            background: 'radial-gradient(circle, rgba(254, 254, 255, 0.98) 10%, rgba(240, 243, 246, 0.95) 45%, rgba(215, 226, 235, 0.9) 100%)',
          }}
        >
          {/* Layered spinning virtual cloud bodies for 3D altitude perception */}
          <div className="absolute w-[250%] h-[250%] opacity-40 animate-[spin_40s_linear_infinite] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.9),transparent_60%)] filter blur-xl" />
          <div className="absolute w-[300%] h-[300%] opacity-35 animate-[spin_60s_linear_infinite_reverse] bg-[radial-gradient(ellipse_at_bottom_left,rgba(240,245,250,0.85),transparent_50%)] filter blur-2xl" />
          <div className="absolute w-[200%] h-[200%] opacity-50 bg-[radial-gradient(circle_at_center,rgba(255,255,255,1),transparent_65%)] filter blur-3xl" />
          
          {/* Orbital telemetry feedback during instrument descend */}
          <div className="z-10 text-center px-6 py-4 bg-white/50 border border-white/70 rounded-2xl shadow-xl backdrop-blur-md flex flex-col items-center gap-1.5 transform transition-transform duration-500 scale-95 border-b-2">
            <div className="relative mb-1">
              <Compass className="w-9 h-9 text-[#1E3B30] animate-spin" />
              <Orbit className="w-5 h-5 text-emerald-500 absolute top-2 left-2 animate-ping" />
            </div>
            
            <span className="font-mono text-[10px] tracking-[0.3em] font-extrabold text-[#1E3B30] uppercase animate-pulse">
              Orbital Decelerating
            </span>
            <div className="h-0.5 w-16 bg-[#1A3428]/20 rounded-full my-1 overflow-hidden">
              <div className="h-full bg-[#1E3B30] animate-[shimmer_1s_infinite]" style={{ width: '60%' }} />
            </div>
            
            <p className="font-serif text-[13px] font-medium text-stone-800 leading-tight">
              Penetrating Cloud Layers...
            </p>
            <span className="font-mono text-[8px] text-stone-500 uppercase tracking-widest block">
              ALT: 12,500m &bull; LOCK ON
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
