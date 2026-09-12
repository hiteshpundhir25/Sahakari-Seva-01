// ==============================================================================
// WORKER JOBS MAP VIEW — LEAFLET + OPENSTREETMAP LIVE RADAR & DISPATCH
// Displays worker GPS origin, service radius, in-progress jobs with route lines,
// committed scheduled jobs, blinking live requests, and demand hotspot zones.
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { Booking } from '../../types';
import { DemandHotspot, WorkerMapService } from '../../services/workerMapService';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';

interface WorkerJobsMapViewProps {
  workerLocation: { latitude: number; longitude: number };
  serviceRadiusKm: number;
  jobs: Booking[];
  demandHotspots?: DemandHotspot[];
  selectedJobId?: string | null;
  selectedHotspotId?: string | null;
  filter?: 'all' | 'in_progress' | 'accepted' | 'pending' | 'hotspots';
  onSelectJob: (job: Booking) => void;
  onSelectHotspot?: (hotspot: DemandHotspot) => void;
}

export const WorkerJobsMapView: React.FC<WorkerJobsMapViewProps> = ({
  workerLocation,
  serviceRadiusKm,
  jobs,
  demandHotspots = [],
  selectedJobId,
  selectedHotspotId,
  filter = 'all',
  onSelectJob,
  onSelectHotspot,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const webViewRef = useRef<any>(null);

  // Filter jobs based on active filter chip
  const filteredJobs = jobs.filter((job) => {
    if (filter === 'all') return true;
    if (filter === 'in_progress') return job.status === 'in_progress';
    if (filter === 'accepted') return job.status === 'accepted';
    if (filter === 'pending') return job.status === 'pending';
    if (filter === 'hotspots') return false;
    return true;
  });

  const showHotspots = filter === 'all' || filter === 'hotspots';

  // Listen for window message on Web
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'SELECT_JOB') {
          const found = jobs.find((j) => j.id === data.jobId);
          if (found) onSelectJob(found);
        } else if (data.type === 'SELECT_HOTSPOT' && onSelectHotspot) {
          const found = demandHotspots.find((h) => h.id === data.hotspotId);
          if (found) onSelectHotspot(found);
        }
      } catch {
        // Ignore non-json messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [jobs, demandHotspots, onSelectJob, onSelectHotspot]);

  // Generate self-contained Leaflet HTML
  const generateLeafletHtml = () => {
    // In-progress job for connecting route polyline
    const inProgressJob = jobs.find((j) => j.status === 'in_progress');
    const inProgressCoords = inProgressJob ? WorkerMapService.resolveBookingCoordinates(inProgressJob) : null;

    // Build job markers JS
    const jobMarkersJs = filteredJobs
      .map((job) => {
        const coords = WorkerMapService.resolveBookingCoordinates(job);
        const isInProgress = job.status === 'in_progress';
        const isAccepted = job.status === 'accepted';
        const isPending = job.status === 'pending';
        const isEmergency = job.is_emergency;
        const isSelected = job.id === selectedJobId;

        // Custom HTML marker for Leaflet
        let markerHtml = '';
        if (isInProgress) {
          markerHtml = `
            <div class="beacon-container ${isSelected ? 'selected' : ''}">
              <div class="active-pulse-ring"></div>
              <div class="active-pulse-core">
                <span class="beacon-icon">⚡</span>
              </div>
              <div class="beacon-tag active-tag">ACTIVE JOB</div>
            </div>
          `;
        } else if (isEmergency) {
          markerHtml = `
            <div class="beacon-container ${isSelected ? 'selected' : ''}">
              <div class="emergency-pulse-ring"></div>
              <div class="emergency-pulse-core">
                <span class="beacon-icon">🚨</span>
              </div>
              <div class="beacon-tag emergency-tag">EMERGENCY</div>
            </div>
          `;
        } else if (isAccepted) {
          markerHtml = `
            <div class="beacon-container ${isSelected ? 'selected' : ''}">
              <div class="accepted-pin">
                <span class="pin-icon">✓</span>
              </div>
              <div class="beacon-tag accepted-tag">${job.booking_time} Committed</div>
            </div>
          `;
        } else {
          // Pending Live Request — Blinking radar rings like on-demand delivery apps
          markerHtml = `
            <div class="beacon-container ${isSelected ? 'selected' : ''}">
              <div class="radar-ripple-ring"></div>
              <div class="radar-ripple-ring delay"></div>
              <div class="pending-pin">
                <span class="pin-icon">●</span>
              </div>
              <div class="beacon-tag pending-tag">Live Request</div>
            </div>
          `;
        }

        return `
          (function() {
            var icon = L.divIcon({
              className: 'custom-job-div-icon',
              html: '${markerHtml.replace(/\n/g, '').trim()}',
              iconSize: [60, 60],
              iconAnchor: [30, 30]
            });
            var marker = L.marker([${coords.latitude}, ${coords.longitude}], { icon: icon })
              .addTo(map)
              .on('click', function() {
                var payload = { type: 'SELECT_JOB', jobId: '${job.id}' };
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify(payload));
                } else if (window.parent) {
                  window.parent.postMessage(payload, '*');
                }
              });
          })();
        `;
      })
      .join('\n');

    // Build Hotspots JS
    const hotspotsJs = showHotspots
      ? demandHotspots
          .map((hotspot) => {
            const isSelected = hotspot.id === selectedHotspotId;
            return `
            (function() {
              // Hotspot zone circle
              L.circle([${hotspot.latitude}, ${hotspot.longitude}], {
                color: '#8b5cf6',
                fillColor: '#8b5cf6',
                fillOpacity: 0.14,
                weight: 1.5,
                dashArray: '4, 6',
                radius: 1600
              }).addTo(map);

              var hotspotHtml = '<div class="hotspot-pin ${isSelected ? 'selected' : ''}"><div class="hotspot-pulse"></div><div class="hotspot-core">🔥</div><div class="hotspot-tag">${hotspot.activeRequestsCount} Live Inquiries</div></div>';
              var hIcon = L.divIcon({
                className: 'custom-hotspot-icon',
                html: hotspotHtml,
                iconSize: [80, 40],
                iconAnchor: [40, 20]
              });
              L.marker([${hotspot.latitude}, ${hotspot.longitude}], { icon: hIcon })
                .addTo(map)
                .on('click', function() {
                  var payload = { type: 'SELECT_HOTSPOT', hotspotId: '${hotspot.id}' };
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
                  } else if (window.parent) {
                    window.parent.postMessage(payload, '*');
                  }
                });
            })();
          `;
          })
          .join('\n')
      : '';

    // Route polyline from worker to active job
    const routePolylineJs =
      inProgressCoords && filter !== 'hotspots'
        ? `
        // Turn-by-turn guidance polyline connecting worker GPS to currently going job
        var routeLine = L.polyline([
          [${workerLocation.latitude}, ${workerLocation.longitude}],
          [${inProgressCoords.latitude}, ${inProgressCoords.longitude}]
        ], {
          color: '#2563eb',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8'
        }).addTo(map);
      `
        : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            html, body, #osm-worker-map {
              height: 100%;
              width: 100%;
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .leaflet-control-attribution { font-size: 9px !important; opacity: 0.7; }

            /* Custom Div Icons Reset */
            .custom-job-div-icon, .custom-hotspot-icon, .custom-worker-icon {
              background: transparent !important;
              border: none !important;
            }

            /* Beacon Container */
            .beacon-container {
              position: relative;
              width: 60px;
              height: 60px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            }

            /* Tag under marker */
            .beacon-tag {
              position: absolute;
              bottom: 2px;
              white-space: nowrap;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 7px;
              border-radius: 999px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.18);
              pointer-events: none;
              letter-spacing: 0.2px;
            }

            /* 1. Worker Live GPS Origin Marker */
            .worker-origin-pin {
              position: relative;
              width: 46px;
              height: 46px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .worker-gps-core {
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: #0284c7;
              border: 3px solid #ffffff;
              box-shadow: 0 0 12px rgba(2, 132, 199, 0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 11px;
              font-weight: bold;
              z-index: 2;
            }
            .worker-gps-halo {
              position: absolute;
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: rgba(2, 132, 199, 0.22);
              animation: worker-gps-pulse 2.2s infinite ease-out;
              z-index: 1;
            }
            @keyframes worker-gps-pulse {
              0% { transform: scale(0.6); opacity: 0.9; }
              70% { transform: scale(1.6); opacity: 0.15; }
              100% { transform: scale(2.0); opacity: 0; }
            }

            /* 2. In-Progress Currently Going Job Marker */
            .active-pulse-core {
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: #2563eb;
              border: 3px solid #ffffff;
              box-shadow: 0 0 14px rgba(37, 99, 235, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 14px;
              z-index: 3;
            }
            .active-pulse-ring {
              position: absolute;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              border: 2px solid #2563eb;
              background: rgba(37, 99, 235, 0.25);
              animation: active-beacon-pulse 1.8s infinite cubic-bezier(0.25, 1, 0.5, 1);
              z-index: 2;
            }
            @keyframes active-beacon-pulse {
              0% { transform: scale(0.7); opacity: 0.9; }
              60% { transform: scale(1.7); opacity: 0.3; }
              100% { transform: scale(2.2); opacity: 0; }
            }
            .active-tag {
              background: #1e40af;
              color: #ffffff;
              border: 1px solid #60a5fa;
            }

            /* 3. Committed Scheduled Job Marker */
            .accepted-pin {
              width: 26px;
              height: 26px;
              border-radius: 50%;
              background: #059669;
              border: 2.5px solid #ffffff;
              box-shadow: 0 2px 8px rgba(5, 150, 105, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 13px;
              font-weight: 800;
              z-index: 3;
            }
            .accepted-tag {
              background: #065f46;
              color: #ecfdf5;
              border: 1px solid #34d399;
            }

            /* 4. Live Job Requests — Pulsing / Blinking Radar (Delivery App Style) */
            .pending-pin {
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: #f59e0b;
              border: 2.5px solid #ffffff;
              box-shadow: 0 2px 8px rgba(245, 158, 11, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 10px;
              z-index: 3;
            }
            .radar-ripple-ring {
              position: absolute;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              border: 2px solid #f59e0b;
              background: rgba(245, 158, 11, 0.2);
              animation: radar-pulse 1.8s infinite linear;
              z-index: 2;
            }
            .radar-ripple-ring.delay {
              animation-delay: 0.9s;
            }
            @keyframes radar-pulse {
              0% { transform: scale(0.6); opacity: 0.9; }
              70% { transform: scale(1.6); opacity: 0.25; }
              100% { transform: scale(2.2); opacity: 0; }
            }
            .pending-tag {
              background: #b45309;
              color: #fffbeb;
              border: 1px solid #fbbf24;
            }

            /* 5. Emergency Requests — Rapid Flash Beacon */
            .emergency-pulse-core {
              width: 26px;
              height: 26px;
              border-radius: 50%;
              background: #dc2626;
              border: 2.5px solid #ffffff;
              box-shadow: 0 0 12px rgba(220, 38, 38, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 13px;
              z-index: 3;
              animation: emergency-blink 0.9s infinite alternate;
            }
            .emergency-pulse-ring {
              position: absolute;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              border: 2px solid #dc2626;
              background: rgba(220, 38, 38, 0.25);
              animation: radar-pulse 1.1s infinite linear;
              z-index: 2;
            }
            @keyframes emergency-blink {
              from { transform: scale(1); filter: drop-shadow(0 0 4px #ef4444); }
              to { transform: scale(1.15); filter: drop-shadow(0 0 14px #dc2626); }
            }
            .emergency-tag {
              background: #991b1b;
              color: #fef2f2;
              border: 1px solid #f87171;
            }

            /* 6. Live Demand Hotspots */
            .hotspot-pin {
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              cursor: pointer;
            }
            .hotspot-core {
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: #7c3aed;
              border: 2.5px solid #ffffff;
              box-shadow: 0 0 12px rgba(124, 58, 237, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 13px;
              z-index: 2;
            }
            .hotspot-pulse {
              position: absolute;
              width: 48px;
              height: 48px;
              top: -10px;
              border-radius: 50%;
              background: rgba(124, 58, 237, 0.2);
              animation: hotspot-wave 2.2s infinite ease-out;
              z-index: 1;
            }
            @keyframes hotspot-wave {
              0% { transform: scale(0.6); opacity: 0.8; }
              100% { transform: scale(1.8); opacity: 0; }
            }
            .hotspot-tag {
              margin-top: 3px;
              background: #5b21b6;
              color: #f5f3ff;
              font-size: 9px;
              font-weight: 800;
              padding: 2px 6px;
              border-radius: 999px;
              white-space: nowrap;
              border: 1px solid #c4b5fd;
              box-shadow: 0 2px 4px rgba(0,0,0,0.18);
            }

            /* Selected Pin Focus Highlight */
            .beacon-container.selected .active-pulse-core,
            .beacon-container.selected .accepted-pin,
            .beacon-container.selected .pending-pin,
            .beacon-container.selected .emergency-pulse-core,
            .hotspot-pin.selected .hotspot-core {
              outline: 3px solid #facc15;
              outline-offset: 2px;
              transform: scale(1.22);
              transition: transform 0.2s ease;
            }
          </style>
        </head>
        <body>
          <div id="osm-worker-map"></div>
          <script>
            var map = L.map('osm-worker-map', {
              zoomControl: true,
              attributionControl: true
            }).setView([${workerLocation.latitude}, ${workerLocation.longitude}], 12);

            // OpenStreetMap Standard Free Vector/Raster Tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);

            // Worker Dispatch GPS Origin Marker
            var workerIcon = L.divIcon({
              className: 'custom-worker-icon',
              html: '<div class="worker-origin-pin"><div class="worker-gps-halo"></div><div class="worker-gps-core">📍</div></div>',
              iconSize: [46, 46],
              iconAnchor: [23, 23]
            });
            L.marker([${workerLocation.latitude}, ${workerLocation.longitude}], { icon: workerIcon })
              .addTo(map)
              .bindPopup('<b>Worker Dispatch Base (You)</b><br/>Current GPS fix active');

            // Operating Service Radius Circle (Configurable km)
            L.circle([${workerLocation.latitude}, ${workerLocation.longitude}], {
              color: '#0284c7',
              fillColor: '#38bdf8',
              fillOpacity: 0.08,
              weight: 1.8,
              radius: ${serviceRadiusKm * 1000}
            }).addTo(map);

            // Draw route polyline for active job
            ${routePolylineJs}

            // Draw all jobs markers
            ${jobMarkersJs}

            // Draw live demand hotspot clusters
            ${hotspotsJs}
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <iframe
          title="WorkerJobRadarMap"
          srcDoc={generateLeafletHtml()}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      ) : (
        (() => {
          try {
            const { WebView } = require('react-native-webview');
            return (
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: generateLeafletHtml() }}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={(event: any) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.type === 'SELECT_JOB') {
                      const found = jobs.find((j) => j.id === data.jobId);
                      if (found) onSelectJob(found);
                    } else if (data.type === 'SELECT_HOTSPOT' && onSelectHotspot) {
                      const found = demandHotspots.find((h) => h.id === data.hotspotId);
                      if (found) onSelectHotspot(found);
                    }
                  } catch {}
                }}
              />
            );
          } catch {
            return (
              <View style={styles.nativeNotice}>
                <Text style={styles.nativeNoticeText}>
                  Worker Live Job Radar Active ({filteredJobs.length} jobs plotted)
                </Text>
              </View>
            );
          }
        })()
      )}
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      position: 'relative',
    },
    nativeNotice: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      padding: 16,
    },
    nativeNoticeText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
