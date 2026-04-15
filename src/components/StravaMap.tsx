import { MapContainer, TileLayer, Polyline, useMap, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';

// Fix for default marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function decodePolyline(encoded: string): [number, number][] {
    let points: [number, number][] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
}

function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.invalidateSize();
            map.fitBounds(bounds, { padding: [40, 40] });
        }
    }, [bounds, map]);
    return null;
}

interface StravaMapProps {
    polyline: string;
    distance?: string | number;
    date?: string;
    pace?: string;
}

export default function StravaMap({ polyline, distance, date, pace }: StravaMapProps) {
    const [isInteractive, setIsInteractive] = useState(false);

    if (!polyline) return null;

    const positions = decodePolyline(polyline);
    if (positions.length === 0) return null;

    const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
    const startPos = positions[0];

    const startIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #FC4C02; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 15px rgba(252, 76, 2, 0.8);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });

    return (
        <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-surface-container-low my-4 flex flex-col">
            {/* Header with Toggle */}
            <div className="bg-[#1c1c1f] px-5 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FC4C02] text-xs">explore</span>
                    <span className="font-['Space_Grotesk'] text-[11px] uppercase font-bold tracking-[0.15em] text-zinc-300">
                        {isInteractive ? 'INTERACTIVE MAP' : 'MY ROUTE & MAP'}
                    </span>
                </div>
                
                <button 
                    onClick={() => setIsInteractive(!isInteractive)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                        isInteractive 
                        ? 'bg-[#FC4C02] text-white shadow-[0_0_15px_rgba(252,76,2,0.4)]' 
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}
                >
                    <span className="material-symbols-outlined text-[12px]">
                        {isInteractive ? 'lock_open' : 'lock'}
                    </span>
                    {isInteractive ? 'INTERACTING' : 'TAP TO UNLOCK'}
                </button>
            </div>

            <div className="relative h-64 w-full z-0 group">
                <style dangerouslySetInnerHTML={{ __html: `
                    .esri-contrast { filter: contrast(1.2) brightness(1.1) saturate(1.2) !important; }
                    .leaflet-container { background: #242426 !important; }
                `}} />
                
                {/* Overlay for locking interaction when disabled */}
                {!isInteractive && (
                    <div 
                        onClick={() => setIsInteractive(true)}
                        className="absolute inset-0 z-[1001] cursor-pointer group-hover:bg-black/10 transition-colors"
                        title="Toca para interactuar con el mapa"
                    >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                             <div className="bg-black/80 px-4 py-2 rounded-full border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                 <span className="material-symbols-outlined text-sm">touch_app</span>
                                 Toca para explorar
                             </div>
                        </div>
                    </div>
                )}

                <MapContainer
                    bounds={bounds}
                    zoomControl={false}
                    attributionControl={false}
                    className="w-full h-full"
                    dragging={isInteractive}
                    touchZoom={isInteractive}
                    scrollWheelZoom={false}
                    doubleClickZoom={isInteractive}
                >
                    <TileLayer
                        url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                        className="esri-contrast"
                    />
                    <TileLayer
                        url="https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                        opacity={0.8}
                    />
                    <Polyline
                        positions={positions}
                        pathOptions={{ color: '#FC4C02', weight: 5, opacity: 1, lineJoin: 'round' }}
                    />
                    <Marker position={startPos} icon={startIcon} />
                    <ChangeView bounds={bounds} />
                </MapContainer>

                {/* Overlays */}
                <div className="absolute top-4 right-4 z-[1000] pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1 flex items-center gap-2 shadow-xl opacity-80">
                         <span className="material-symbols-outlined text-[12px] text-[#FC4C02]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                         <span className="font-['Space_Grotesk'] text-[9px] font-bold uppercase tracking-widest text-white">START/FINISH</span>
                    </div>
                </div>

                {isInteractive && (
                    <div className="absolute bottom-4 right-4 z-[1000]">
                         <button 
                            onClick={() => setIsInteractive(false)}
                            className="bg-[#FC4C02] text-white p-2 rounded-full shadow-2xl animate-in zoom-in"
                         >
                            <span className="material-symbols-outlined text-sm">lock</span>
                         </button>
                    </div>
                )}

                {/* Subtle depth effect */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/10 via-transparent to-black/30"></div>
            </div>
        </div>
    );
}
