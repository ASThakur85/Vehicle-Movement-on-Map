import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import routeData from './dummy-route.json';
import busIconUrl from './assets/bus-icon.png';

const VehicleMap = () => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const animationRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [intervalMs, setIntervalMs] = useState(1000);

  const createBusIcon = (angle = 0) =>
    L.icon({
      iconUrl: busIconUrl,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      className: 'bus-icon',
    });

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map', {
        center: [routeData[0].latitude, routeData[0].longitude],
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);

      markerRef.current = L.marker(
        [routeData[0].latitude, routeData[0].longitude],
        {
          icon: createBusIcon(),
          rotationAngle: 0,
          rotationOrigin: 'center center',
        }
      ).addTo(mapRef.current);

      polylineRef.current = L.polyline([], {
        color: 'blue',
        weight: 4,
      }).addTo(mapRef.current);

      L.polyline(routeData.map(p => [p.latitude, p.longitude]), {
        color: 'gray',
        weight: 2,
        dashArray: '5, 5',
      }).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isPlaying && index < routeData.length - 1) {
      interval = setInterval(() => {
        const currentPoint = routeData[index];
        const nextPoint = routeData[index + 1];

        animateMarker(currentPoint, nextPoint, intervalMs);
        animatePolyline(currentPoint, nextPoint, intervalMs);

        setElapsed(
          Math.floor(
            (new Date(nextPoint.timestamp) - new Date(routeData[0].timestamp)) / 1000
          )
        );

        const dist = getDistance(currentPoint, nextPoint);
        const timeDiff = (new Date(nextPoint.timestamp) - new Date(currentPoint.timestamp)) / 1000;
        const spd = timeDiff > 0 ? (dist / timeDiff) * 3.6 : 0;
        setSpeed(spd.toFixed(2));

        setIndex((prev) => prev + 1);
      }, intervalMs);
    } else if (index >= routeData.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, index, intervalMs]);

  const animateMarker = (start, end, duration) => {
    const steps = 20;
    const delay = duration / steps;
    let step = 0;
    const latDiff = (end.latitude - start.latitude) / steps;
    const lngDiff = (end.longitude - start.longitude) / steps;

    const angle = getBearing(start.latitude, start.longitude, end.latitude, end.longitude);

    markerRef.current.setIcon(createBusIcon(angle));
    markerRef.current.options.rotationAngle = angle;

    if (animationRef.current) clearInterval(animationRef.current);

    animationRef.current = setInterval(() => {
      if (step >= steps) {
        clearInterval(animationRef.current);
        return;
      }
      const newLat = start.latitude + latDiff * step;
      const newLng = start.longitude + lngDiff * step;
      markerRef.current.setLatLng([newLat, newLng]);
      step++;
    }, delay);
  };

  const animatePolyline = (start, end, duration) => {
    const steps = 20;
    const delay = duration / steps;
    let step = 0;
    const latDiff = (end.latitude - start.latitude) / steps;
    const lngDiff = (end.longitude - start.longitude) / steps;

    const animation = setInterval(() => {
      if (step > steps) {
        clearInterval(animation);
        return;
      }
      const lat = start.latitude + latDiff * step;
      const lng = start.longitude + lngDiff * step;
      polylineRef.current.addLatLng([lat, lng]);
      step++;
    }, delay);
  };

  const togglePlay = () => {
    if (index < routeData.length - 1) {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleSpeedChange = (e) => {
    const value = Number(e.target.value);
    setIntervalMs(value);
  };

  const handleReset = () => {
    setIndex(0);
    setElapsed(0);
    setSpeed(0);
    setIsPlaying(false);
    if (markerRef.current && routeData.length > 0) {
      markerRef.current.setLatLng([routeData[0].latitude, routeData[0].longitude]);
    }
    if (polylineRef.current) {
      polylineRef.current.setLatLngs([]);
    }
  };

  const current = routeData[index];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 textAlign-center bg-blue-100 py-2 rounded shadow">
        🚌 Vehicle Movement on Map
      </h1>

      <div id="map" className="rounded shadow border" style={{ height: '500px', width: '100%' }}></div>

      <div className="mt-4 space-y-4">
        <div className="flex justifyContent-center space-x-4">
          <button
            onClick={togglePlay}
            disabled={index >= routeData.length - 1}
            className={`px-6 py-2 text-white rounded transition ${
              index >= routeData.length - 1
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isPlaying ? 'Pause' : '▶️ Play'}
          </button>

          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
          >
            🔄 Reset
          </button>
        </div>

        <div className="text-sm">
          <label htmlFor="speed" className="block mb-1 font-medium">Simulation Speed</label>
          <input
            type="range"
            id="speed"
            min="200"
            max="3000"
            step="100"
            value={intervalMs}
            onChange={handleSpeedChange}
            className="w-full"
          />
          <div className="text-gray-600 mt-1">Interval: {intervalMs} ms</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div><strong>Current Coordinates:</strong><br />{current.latitude}, {current.longitude}</div>
          <div><strong>Elapsed Time:</strong><br />{elapsed} sec</div>
          <div><strong>Speed:</strong><br />{speed} km/h</div>
        </div>
      </div>
    </div>
  );
};

function getDistance(coord1, coord2) {
  const R = 6371e3;
  const φ1 = coord1.latitude * (Math.PI / 180);
  const φ2 = coord2.latitude * (Math.PI / 180);
  const Δφ = (coord2.latitude - coord1.latitude) * (Math.PI / 180);
  const Δλ = (coord2.longitude - coord1.longitude) * (Math.PI / 180);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function getBearing(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const λ1 = (lon1 * Math.PI) / 180;
  const λ2 = (lon2 * Math.PI) / 180;
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  return (θ * 180 / Math.PI + 360) % 360;
}

export default VehicleMap;
