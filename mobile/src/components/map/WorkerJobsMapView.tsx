// ==============================================================================
// WORKER JOBS MAP VIEW — MINIMALIST DOT MARKERS & EXPANDED MAP CANVAS
// Displays worker GPS origin, service radius, and clean simple dots:
// - Red dot: Emergency request
// - Green dot: Committed scheduled job
// - Yellow dot: Live pending request
// - Blue dot: In-progress active job with subtle route polyline
// - Purple dot: Demand hotspot cluster
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

  // Generate self-contained Leaflet HTML with simple, clean, minimalist dots
  const generateLeafletHtml = () => {
    // In-progress job for connecting route polyline
    const inProgressJob = jobs.find((j) => j.status === 'in_progress');
    const inProgressCoords = inProgressJob ? WorkerMapService.resolveBookingCoordinates(inProgressJob) : null;

    // Build simple dot markers JS
    const jobMarkersJs = filteredJobs
      .map((job) => {
        const coords = WorkerMapService.resolveBookingCoordinates(job);
        const isInProgress = job.status === 'in_progress';
        const isAccepted = job.status === 'accepted';
        const isEmergency = job.is_emergency;
        const isSelected = job.id === selectedJobId;

        // Simple color class: Red (emergency), Green (committed), Yellow (pending), Blue (in_progress)
        let dotClass = 'dot-yellow';
        if (isInProgress) {
          dotClass = 'dot-blue';
        } else if (isEmergency) {
          dotClass = 'dot-red';
        } else if (isAccepted) {
          dotClass = 'dot-green';
        }

        const markerHtml = `
          <div class="simple-dot-wrap ${isSelected ? 'selected' : ''}">
            <div class="simple-dot ${dotClass}"></div>
          </div>
        `;

        return `
          (function() {
            var icon = L.divIcon({
              className: 'custom-dot-icon',
              html: '${markerHtml.replace(/\n/g, '').trim()}',
              iconSize: [26, 26],
              iconAnchor: [13, 13]
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

    // Build Hotspots JS as simple clean purple dots with subtle area circles
    const hotspotsJs = showHotspots
      ? demandHotspots
          .map((hotspot) => {
            const isSelected = hotspot.id === selectedHotspotId;
            const hHtml = `
              <div class="simple-dot-wrap ${isSelected ? 'selected' : ''}">
                <div class="simple-dot dot-purple"></div>
              </div>
            `;
            return `
            (function() {
              // Subtle demand area circle
              L.circle([${hotspot.latitude}, ${hotspot.longitude}], {
                color: '#8b5cf6',
                fillColor: '#8b5cf6',
                fillOpacity: 0.08,
                weight: 1,
                dashArray: '3, 5',
                radius: 1400
              }).addTo(map);

              var hIcon = L.divIcon({
                className: 'custom-dot-icon',
                html: '${hHtml.replace(/\n/g, '').trim()}',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
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
        var routeLine = L.polyline([
          [${workerLocation.latitude}, ${workerLocation.longitude}],
          [${inProgressCoords.latitude}, ${inProgressCoords.longitude}]
        ], {
          color: '#2563eb',
          weight: 3.5,
          opacity: 0.8,
          dashArray: '6, 6'
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
            .leaflet-control-attribution { font-size: 8px !important; opacity: 0.6; }

            /* Custom Div Icons Reset */
            .custom-dot-icon, .custom-worker-icon {
              background: transparent !important;
              border: none !important;
            }

            /* Simple Dot Wrap */
            .simple-dot-wrap {
              width: 26px;
              height: 26px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              position: relative;
            }

            /* Clean Simple Dots: Red, Green, Yellow, Blue, Purple */
            .simple-dot {
              width: 14px;
              height: 14px;
              border-radius: 50%;
              border: 2px solid #ffffff;
              box-shadow: 0 1.5px 4px rgba(0, 0, 0, 0.3);
              position: relative;
              transition: transform 0.15s ease;
            }

            .dot-red {
              background-color: #ef4444;
            }
            .dot-green {
              background-color: #10b981;
            }
            .dot-yellow {
              background-color: #f59e0b;
            }
            .dot-blue {
              background-color: #2563eb;
            }
            .dot-purple {
              background-color: #8b5cf6;
              width: 12px;
              height: 12px;
            }

            /* Subtle, soft blinking ring for emergency red dot */
            .dot-red::after {
              content: '';
              position: absolute;
              top: -4px;
              left: -4px;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 2px solid #ef4444;
              animation: dot-ping 1.3s infinite;
              pointer-events: none;
            }

            /* Subtle soft pulse for yellow pending dot */
            .dot-yellow::after {
              content: '';
              position: absolute;
              top: -4px;
              left: -4px;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 1.5px solid #f59e0b;
              animation: dot-ping 2s infinite;
              pointer-events: none;
            }

            /* Subtle soft pulse for blue in-progress dot */
            .dot-blue::after {
              content: '';
              position: absolute;
              top: -4px;
              left: -4px;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 1.5px solid #2563eb;
              animation: dot-ping 2s infinite;
              pointer-events: none;
            }

            @keyframes dot-ping {
              0% { transform: scale(0.8); opacity: 0.8; }
              100% { transform: scale(1.9); opacity: 0; }
            }

            /* Selected Dot Highlight */
            .simple-dot-wrap.selected .simple-dot {
              transform: scale(1.4);
              box-shadow: 0 0 0 3px #3b82f6, 0 3px 8px rgba(0,0,0,0.35);
              z-index: 10;
            }

            /* Worker GPS Base Dot */
            .worker-gps-wrap {
              width: 26px;
              height: 26px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .worker-gps-dot {
              width: 13px;
              height: 13px;
              border-radius: 50%;
              background: #0284c7;
              border: 2.5px solid #ffffff;
              box-shadow: 0 0 6px rgba(2, 132, 199, 0.7);
            }
          </style>
        </head>
        <body>
          <div id="osm-worker-map"></div>
          <script>
            var map = L.map('osm-worker-map', {
              zoomControl: false,
              attributionControl: true
            }).setView([${workerLocation.latitude}, ${workerLocation.longitude}], 12);

            // OpenStreetMap Standard Tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OpenStreetMap'
            }).addTo(map);

            // Add zoom control at bottom right to keep top spacious
            L.control.zoom({ position: 'bottomright' }).addTo(map);

            // Worker Dispatch GPS Origin Dot
            var workerIcon = L.divIcon({
              className: 'custom-worker-icon',
              html: '<div class="worker-gps-wrap"><div class="worker-gps-dot"></div></div>',
              iconSize: [26, 26],
              iconAnchor: [13, 13]
            });
            L.marker([${workerLocation.latitude}, ${workerLocation.longitude}], { icon: workerIcon })
              .addTo(map)
              .bindPopup('<b>Worker Base (You)</b>');

            // Operating Service Radius Circle
            L.circle([${workerLocation.latitude}, ${workerLocation.longitude}], {
              color: '#0284c7',
              fillColor: '#38bdf8',
              fillOpacity: 0.05,
              weight: 1.5,
              radius: ${serviceRadiusKm * 1000}
            }).addTo(map);

            // Route polyline for active job
            ${routePolylineJs}

            // Draw clean simple dot markers
            ${jobMarkersJs}

            // Draw subtle demand hotspot clusters
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
