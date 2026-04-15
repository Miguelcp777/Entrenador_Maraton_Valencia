import { MapContainer, TileLayer, Polyline, useMap, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
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
    if (!polyline) return null;

    const positions = decodePolyline(polyline);
    if (positions.length === 0) return null;

    const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
    const startPos = positions[0];

    // High contrast start/finish icon
    const startIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #FC4C02; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 15px rgba(252, 76, 2, 0.8);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });

    return (
        <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-surface-container-low my-4 flex flex-col group animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Optimized Header */}
            <div className="bg-[#1c1c1f] px-5 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FC4C02] text-xs">explore</span>
                    <span className="font-['Space_Grotesk'] text-[11px] uppercase font-bold tracking-[0.15em] text-zinc-300">
                        MY ROUTE & MAP
                    </span>
                </div>
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-primary/40"></div>
                    <div className="w-1 h-1 rounded-full bg-primary/60 animate-pulse"></div>
                </div>
            </div>

            <div className="relative h-64 w-full z-0">
                <style dangerouslySetInnerHTML={{ __html: `
                    /* Advanced CSS Filter for "High-Contrast Premium Dark" using Voyager tiles */
                    .premium-dark-tiles {
                        filter: invert(100%) hue-rotate(180deg) brightness(0.9) contrast(1.1) saturate(0.9) !important;
                    }
                    .leaflet-container {
                        background: #111113 !important;
                    }
                    .leaflet-tile {
                        /* Prevent brief flashes of light tiles */
                        background-color: #111113 !important;
                    }
                `}} />
                
                <MapContainer
                    bounds={bounds}
                    zoomControl={false}
                    attributionControl={false}
                    className="w-full h-full"
                    dragging={true}
                    touchZoom={true}
                    scrollWheelZoom={false}
                >
                    {/* We use Voyager (Light) + CSS Inversion for high contrast labels */}
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        className="premium-dark-tiles"
                    />
                    <Polyline
                        positions={positions}
                        pathOptions={{ color: '#FC4C02', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
                    />
                    <Marker position={startPos} icon={startIcon} />
                    <ChangeView bounds={bounds} />
                </MapContainer>

                {/* Overlays */}
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-[1000]">
                    <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-1.5 flex items-center gap-2 shadow-2xl">
                         <span className="material-symbols-outlined text-[14px] text-[#FC4C02]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                         <span className="font-['Space_Grotesk'] text-[10px] font-black uppercase tracking-widest text-white">START/FINISH</span>
                    </div>
                </div>

                {/* Data HUD Overlay */}
                <div className="absolute bottom-4 left-4 z-[1000]">
                    <div className="bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl px-5 py-3 shadow-2xl transform transition-transform group-hover:scale-105 duration-300">
                        <div className="flex flex-col gap-1">
                            <h5 className="font-['Inter'] font-black text-sm text-white flex items-center gap-2">
                                {distance} km 
                                <span className="h-1 w-1 rounded-full bg-zinc-600"></span>
                                <span className="text-zinc-400 font-medium text-[10px] uppercase font-['Space_Grotesk']">{date}</span>
                            </h5>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#FC4C02]"></span>
                                <span className="font-['Space_Grotesk'] text-[11px] text-[#FC4C02] font-black uppercase tracking-widest">
                                    {pace} /km AVG
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vignette effect for depth */}
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.4)]"></div>
            </div>
        </div>
    );
}
