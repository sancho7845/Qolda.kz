import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Task, TaskCategory, CATEGORY_LABELS } from '../types';

// Almaty boundaries Helper
export const ALMATY_BOUNDS = {
  minLat: 43.05,
  maxLat: 43.45,
  minLng: 76.60,
  maxLng: 77.15,
};

export const isInsideAlmaty = (lat: number, lng: number) => {
  return lat >= ALMATY_BOUNDS.minLat && lat <= ALMATY_BOUNDS.maxLat && 
         lng >= ALMATY_BOUNDS.minLng && lng <= ALMATY_BOUNDS.maxLng;
};

interface InteractiveMapProps {
  mode: 'picker' | 'view';
  theme?: 'dark' | 'light';
  tasks?: Task[];
  currentUserId?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  onAcceptTask?: (taskId: string) => void;
  pickerLat?: number | null;
  pickerLng?: number | null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  mode,
  theme = 'light',
  tasks = [],
  currentUserId,
  onLocationSelect,
  onAcceptTask,
  pickerLat,
  pickerLng,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const ALMATY_CENTER: [number, number] = [43.238949, 76.889709];

  // Emojis for categories
  const categoryIcons: Record<string, string> = {
    elderly: '👵',
    delivery: '📦',
    moving: '🚚',
    education: '📚',
    technology: '💻',
    healthcare: '💊',
    ecology: '🌱',
    other: '🤝',
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Determine initial center
    let initialCenter = ALMATY_CENTER;
    let initialZoom = 12;

    if (mode === 'picker' && pickerLat && pickerLng) {
      initialCenter = [pickerLat, pickerLng];
      initialZoom = 15;
    }

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      maxBounds: [
        [ALMATY_BOUNDS.minLat - 0.2, ALMATY_BOUNDS.minLng - 0.2],
        [ALMATY_BOUNDS.maxLat + 0.2, ALMATY_BOUNDS.maxLng + 0.2]
      ],
      maxBoundsViscosity: 0.8
    });

    mapRef.current = map;

    // Set custom pins and marker group
    markersGroupRef.current = L.layerGroup().addTo(map);

    // Dynamic resize handler using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Tiles based on Dark/Light Theme
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing tile layers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current?.removeLayer(layer);
      }
    });

    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const attribution = theme === 'dark'
      ? '&copy; <a href="https://openstreetmap.org">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
      : '&copy; <a href="https://openstreetmap.org">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

    L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, [theme]);

  // Handle click events on map for PICkER mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== 'picker') return;

    const onMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (!isInsideAlmaty(lat, lng)) {
        alert('Таңдалған орын Алматы қаласының шекарасынан тыс! Карта тек Алматы қаласы бойынша ғана жұмыс істейді.');
        return;
      }

      if (onLocationSelect) {
        onLocationSelect(lat, lng);
      }
    };

    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [mode, onLocationSelect]);

  // Update picker marker position
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== 'picker') return;

    if (pickerLat && pickerLng) {
      const position: [number, number] = [pickerLat, pickerLng];

      if (!pickerMarkerRef.current) {
        const pickerIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center w-10 h-10">
              <span class="absolute inline-flex h-full w-full rounded-full animate-ping bg-teal-500 opacity-60"></span>
              <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-teal-600 text-white shadow-xl border-2 border-white dark:border-neutral-900">
                <span style="font-size: 18px; line-height: 1;">📍</span>
              </div>
            </div>
          `,
          className: 'custom-leaflet-picker-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        pickerMarkerRef.current = L.marker(position, { icon: pickerIcon }).addTo(map);
      } else {
        pickerMarkerRef.current.setLatLng(position);
      }

      // Pan to marker
      map.setView(position, map.getZoom() > 14 ? map.getZoom() : 15);
    } else {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.remove();
        pickerMarkerRef.current = null;
      }
    }
  }, [pickerLat, pickerLng, mode]);

  // Update tasks markers for VIEW mode
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup || mode !== 'view') return;

    // Clear old markers
    markersGroup.clearLayers();

    // Map Tasks to Markers
    tasks.forEach((task) => {
      // Completed tasks are hidden on map
      if (task.status === 'completed') return;
      if (!task.latitude || !task.longitude) return;

      const position: [number, number] = [task.latitude, task.longitude];
      const emoji = categoryIcons[task.category] || '🤝';
      const isYourOwnTask = task.creatorId === currentUserId;

      const isNew = task.status === 'new';
      const colorClass = isNew
        ? (isYourOwnTask ? 'bg-teal-600 shadow-teal-500/50' : 'bg-teal-500 shadow-teal-400/50')
        : 'bg-amber-500 shadow-amber-400/50';

      const pulseClass = isNew 
        ? 'animate-ping opacity-60 bg-teal-400' 
        : 'animate-ping opacity-60 bg-amber-400';

      const customIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 cursor-pointer">
            <span class="absolute inline-flex h-full w-full rounded-full ${pulseClass}"></span>
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${colorClass} text-white shadow-md border-2 border-white dark:border-neutral-900 hover:scale-110 active:scale-95 transition-transform duration-200">
              <span style="font-size: 16px; line-height: 1;">${emoji}</span>
            </div>
          </div>
        `,
        className: 'custom-leaflet-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -10]
      });

      const categoryKazakhLabel = CATEGORY_LABELS[task.category as TaskCategory] || task.category;
      const statusLabel = task.status === 'new' 
        ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-100 dark:border-teal-900">ЖАҢА</span>'
        : '<span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-150 dark:border-amber-900/40">Орындалуда</span>';

      const urgencyLabel = task.priority === 'high'
        ? '<span class="text-[10px] text-red-600 font-extrabold">🚨 ЖЕДЕЛ</span>'
        : task.priority === 'medium'
        ? '<span class="text-[10px] text-amber-600 font-extrabold">⚡ Орташа</span>'
        : '<span class="text-[10px] text-neutral-500 font-extrabold font-mono">Төмен</span>';

      // Design Popup html dynamically
      const popupContent = `
        <div class="p-3 font-sans text-neutral-800 dark:text-neutral-100 min-w-[240px] max-w-[280px]">
          <div class="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-2">
            ${statusLabel}
            ${urgencyLabel}
          </div>
          <h3 class="font-extrabold text-sm text-neutral-950 dark:text-white leading-snug mb-1">${task.title}</h3>
          <p class="text-xs text-neutral-400 font-extrabold mb-1 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 inline-block rounded">${categoryKazakhLabel}</p>
          <p class="text-xs text-neutral-650 dark:text-neutral-350 flex items-center gap-1 mb-3.5 leading-snug">
            📍 <span class="truncate">${task.address || 'Алматы'}</span>
          </p>
          <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-1.5">
            ${
              isYourOwnTask
                ? '<div class="text-[11px] text-center text-teal-600 font-extrabold bg-teal-50 dark:bg-teal-950/20 py-1.5 rounded-xl border border-teal-100 dark:border-teal-900 select-none">Сіз жариялаған өтініш</div>'
                : task.status === 'new'
                ? `<button 
                    data-action="accept-task" 
                    data-task-id="${task.id}" 
                    style="border: none;"
                    class="w-full text-center bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs py-2 px-3 rounded-xl cursor-pointer hover:shadow-lg transition-all"
                  >
                    🙋 Көмектесуді қабылдау
                  </button>`
                : `<div class="text-[11px] text-center text-amber-600 font-extrabold bg-amber-50 dark:bg-amber-950/20 py-1.5 rounded-xl border border-amber-150/30 select-none">Өтініш орындалу үстінде</div>`
            }
          </div>
        </div>
      `;

      L.marker(position, { icon: customIcon })
        .bindPopup(popupContent, {
          className: 'custom-leaflet-popup',
          maxWidth: 300,
          closeButton: false,
        })
        .addTo(markersGroup);
    });
  }, [tasks, mode, currentUserId]);

  // Attach dynamic listener for custom popup DOM buttons (e.g. Accept buttons)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mode !== 'view' || !onAcceptTask) return;

    const handleContainerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const acceptBtn = target.closest('[data-action="accept-task"]');
      if (acceptBtn) {
        const taskId = acceptBtn.getAttribute('data-task-id');
        if (taskId) {
          onAcceptTask(taskId);
          // Auto close map popups
          if (mapRef.current) {
            mapRef.current.closePopup();
          }
        }
      }
    };

    container.addEventListener('click', handleContainerClick);
    return () => {
      container.removeEventListener('click', handleContainerClick);
    };
  }, [mode, onAcceptTask, tasks]);

  return (
    <div className="relative w-full h-[400px] md:h-full rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-neutral-200/80 dark:border-neutral-800">
      {/* Overlay status label */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-100 dark:border-neutral-850 shadow-md text-[10px] md:text-xs font-bold leading-none select-none flex items-center gap-1.5 text-neutral-800 dark:text-neutral-100">
        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
        {mode === 'picker' ? 'Алматы картасы: Орналасқан жерді нүктемен таңдаңыз' : `Қолжетімді тапсырмалар: ${tasks.filter(t => t.status !== 'completed' && t.latitude && t.longitude).length} маркер`}
      </div>

      <div
        ref={mapContainerRef}
        id="leaflet-holder-element"
        className="w-full h-full skeleton-loader"
        style={{ minHeight: '350px' }}
      />

      {/* Styled Override Leaflet Popups using inline css within the component file */}
      <style>{`
        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.98);
          border-radius: 1.25rem;
          box-shadow: 0 15px 30px -5px rgba(0,0,0,0.1), 0 8px 15px -4px rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.06);
          padding: 0px !important;
        }
        .dark .leaflet-popup-content-wrapper {
          background: rgba(23, 23, 23, 0.98) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: white !important;
        }
        .leaflet-popup-content {
          margin: 0px !important;
        }
        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dark .leaflet-popup-tip {
          background: rgba(23, 23, 23, 0.98) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .custom-leaflet-icon, .custom-leaflet-picker-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          outline: none !important;
          font-family: inherit !important;
        }
      `}</style>
    </div>
  );
};
