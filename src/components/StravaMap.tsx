import { MapContainer, TileLayer, Polyline, useMap, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper to decode Strava polyline
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
            map.fitBounds(bounds, { padding: [30, 30] });
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

    // Custom Start Marker
    const startIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #FC4C02; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(252, 76, 2, 0.5);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    return (
        <div className="w-full rounded-xl overflow-hidden border border-white/5 shadow-2xl bg-surface-container-low my-4 flex flex-col">
            {/* Header style from Photo 2 */}
            <div className="bg-[#2a2a2e] px-4 py-2 border-b border-white/5 flex items-center justify-between">
                <span className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-[#acaaae]">
                    MY ROUTE & MAP
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#FC4C02] animate-pulse"></div>
            </div>

            <div className="relative h-56 w-full z-0 group">
                <MapContainer
                    bounds={bounds}
                    zoomControl={false}
                    attributionControl={false}
                    className="w-full h-full bg-[#1e1e21]"
                    dragging={true}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    <Polyline
                        positions={positions}
                        pathOptions={{ color: '#FC4C02', weight: 4, opacity: 0.9, lineJoin: 'round' }}
                    />
                    <Marker position={startPos} icon={startIcon} />
                    <ChangeView bounds={bounds} />
                </MapContainer>

                {/* Overlays like Photo 2 */}
                
                {/* Top Right: Start/Finish Tag */}
                <div className="absolute top-3 right-3 z-10">
                    <div className="bg-[#1e1e21]/90 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg">
                         <span className="material-symbols-outlined text-[10px] text-[#FC4C02]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                         <span className="font-['Space_Grotesk'] text-[9px] font-bold uppercase tracking-widest text-white">START/FINISH</span>
                    </div>
                </div>

                {/* Bottom Left: Info Overlay */}
                <div className="absolute bottom-3 left-3 z-10">
                    <div className="bg-[#1e1e21]/80 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 shadow-xl">
                        <div className="flex flex-col gap-0.5">
                            <span className="font-['Inter'] font-black text-xs text-white">
                                {distance}km <span className="text-zinc-400 font-normal">({date})</span>
                            </span>
                            <span className="font-['Space_Grotesk'] text-[9px] text-[#FC4C02] font-bold uppercase tracking-wider">
                                Avg Pace {pace} /km
                            </span>
                        </div>
                    </div>
                </div>

                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            </div>
        </div>
    );
}
