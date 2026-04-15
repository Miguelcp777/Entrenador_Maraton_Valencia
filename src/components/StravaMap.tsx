import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';

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

// Component to handle bounds
function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }, [bounds, map]);
    return null;
}

interface StravaMapProps {
    polyline: string;
}

export default function StravaMap({ polyline }: StravaMapProps) {
    if (!polyline) return null;

    const positions = decodePolyline(polyline);
    if (positions.length === 0) return null;

    // Calculate bounds manually or let fitBounds handle it
    const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));

    return (
        <div className="w-full h-48 rounded-xl overflow-hidden border border-white/10 shadow-lg my-4 relative z-0">
            <MapContainer
                bounds={bounds}
                zoomControl={false}
                attributionControl={false}
                className="w-full h-full bg-surface-container-highest"
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Polyline
                    positions={positions}
                    pathOptions={{ color: '#FC4C02', weight: 3, opacity: 0.8 }}
                />
                <ChangeView bounds={bounds} />
            </MapContainer>
            
            {/* Strava Branding Attribution */}
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-['Space_Grotesk'] text-white/50 pointer-events-none uppercase tracking-widest flex items-center gap-1">
                <span>View on Strava</span>
            </div>
        </div>
    );
}
