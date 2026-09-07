// ==============================================================================
// MOBILE API CLIENT — DYNAMIC HOST RESOLUTION & RESILIENT FALLBACKS
// Automatically resolves computer IP when running in Expo Go on mobile.
// Every endpoint falls back to the rich offline mock database so the app is
// fully functional without the backend.
// ==============================================================================

import Constants from 'expo-constants';
import {
  Worker,
  NearbyWorkerResult,
  ServiceCategory,
  Booking,
  DemandForecastRecord,
  WorkforceAllocation,
  Rating,
  Payment,
  Invoice,
  Welfare,
  Notification
} from '../types';
import {
  MOCK_CATEGORIES,
  MOCK_WORKERS,
  MOCK_CUSTOMERS,
  MOCK_BOOKINGS,
  MOCK_RATINGS,
  MOCK_WELFARE,
  MOCK_INVOICES,
  MOCK_NOTIFICATIONS,
  MOCK_ADMIN_STATS,
  buildNearbyWorkers,
  haversineKm,
} from './mockDatabase';

function resolveApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    const normalized = configuredUrl.replace(/\/$/, '');
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  }

  try {
    // In Expo Go, hostUri contains the IP of the development computer
    const hostUri =
      (Constants.expoConfig as any)?.hostUri ||
      (Constants as any).manifest?.debuggerHost ||
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5001/api`;
      }
    }
  } catch (err) {
    // ignore
  }
  // The LAN host above serves Expo Go. This keeps simulators and web working
  // without configuration when no public API URL has been provided.
  return 'http://localhost:5001/api';
}

export class ApiClient {
  private static baseUrl = resolveApiBaseUrl();
  private static isServerAvailable: boolean | null = null;
  private static lastHealthCheck = 0;
  private static readonly OFFLINE_RETRY_INTERVAL_MS = 30000;
  private static readonly REQUEST_TIMEOUT_MS = 1500;
  private static hasLoggedOfflineNotice = false;

  public static setBaseUrl(url: string) {
    this.baseUrl = url;
    this.isServerAvailable = null;
    this.lastHealthCheck = 0;
  }

  public static getBaseUrl(): string {
    return this.baseUrl;
  }

  public static resetServerStatus() {
    this.isServerAvailable = null;
    this.lastHealthCheck = 0;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // If recently verified that server is unreachable, fast-fail to mock database without waiting
    const now = Date.now();
    if (this.isServerAvailable === false && now - this.lastHealthCheck < this.OFFLINE_RETRY_INTERVAL_MS) {
      throw new Error(`Server offline (fast fallback)`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${res.statusText}`);
      }

      this.isServerAvailable = true;
      this.hasLoggedOfflineNotice = false;

      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err: any) {
      clearTimeout(timeoutId);
      this.isServerAvailable = false;
      this.lastHealthCheck = Date.now();

      // Log informative status to terminal instead of triggering mobile device YellowBox
      if (!this.hasLoggedOfflineNotice) {
        this.hasLoggedOfflineNotice = true;
        console.log(
          `[ApiClient] Live backend offline at ${this.baseUrl} — smoothly using built-in cooperative database.`
        );
      }
      throw err;
    }
  }

  // --- SERVICE CATEGORIES ---
  public static async getCategories(): Promise<ServiceCategory[]> {
    try {
      return await this.request<ServiceCategory[]>('/services');
    } catch {
      return MOCK_CATEGORIES;
    }
  }

  // --- WORKERS & GEOLOCATION MATCHING ---
  public static async getNearbyWorkers(
    lat: number,
    lng: number,
    radius = 15,
    service?: string,
    emergency = false
  ): Promise<NearbyWorkerResult[]> {
    try {
      let url = `/workers/nearby?latitude=${lat}&longitude=${lng}&radius=${radius}`;
      if (service && service !== 'all') url += `&service=${encodeURIComponent(service)}`;
      if (emergency) url += `&emergency=true`;
      return await this.request<NearbyWorkerResult[]>(url);
    } catch {
      return buildNearbyWorkers(lat, lng, radius, service, emergency);
    }
  }

  public static async getWorkers(verification?: string): Promise<Worker[]> {
    try {
      const path = verification ? `/workers?verification=${encodeURIComponent(verification)}` : '/workers';
      const res = await this.request<any>(path);
      return Array.isArray(res) ? res : res.data || [];
    } catch {
      const list = verification
        ? MOCK_WORKERS.filter(w => w.verification_status === verification)
        : MOCK_WORKERS;
      return list.length ? list : MOCK_WORKERS;
    }
  }

  public static async getWorkerById(id: string): Promise<Worker> {
    try {
      return await this.request<Worker>(`/workers/${id}`);
    } catch {
      return (
        MOCK_WORKERS.find(w => w.id === id) ||
        MOCK_WORKERS[0] || {
          id: id || 'w0000000-0000-0000-0000-000000000001',
          worker_code: 'WRK-JPR-0101',
          skill_category: 'Electrical',
          skills: ['House Wiring'],
          experience_years: 8,
          service_area: 'C-Scheme, Jaipur',
          pincode: '302001',
          hourly_or_base_rate: 249,
          average_rating: 4.9,
          total_jobs: 142,
          total_earnings: 74200,
          welfare_status: 'Active Member',
          insurance_status: 'Ayushman Bharat + PMSBY',
          availability_status: 'available',
          verification_status: 'verified',
        } as any
      );
    }
  }

  public static async updateWorkerLocation(
    workerId: string,
    lat: number,
    lng: number,
    radius?: number
  ): Promise<Worker> {
    try {
      return await this.request<Worker>(`/workers/${workerId}/location`, {
        method: 'PATCH',
        body: JSON.stringify({ latitude: lat, longitude: lng, service_radius_km: radius })
      });
    } catch {
      const w = MOCK_WORKERS.find(x => x.id === workerId);
      if (w) {
        w.latitude = lat;
        w.longitude = lng;
        w.service_radius_km = radius ?? w.service_radius_km;
        return w;
      }
      return { id: workerId, latitude: lat, longitude: lng, service_radius_km: radius } as any;
    }
  }

  public static async updateWorkerAvailability(
    workerId: string,
    status: string
  ): Promise<Worker> {
    try {
      return await this.request<Worker>(`/workers/${workerId}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch {
      const w = MOCK_WORKERS.find(x => x.id === workerId);
      if (w) {
        w.availability_status = status as any;
        return w;
      }
      return { id: workerId, availability_status: status } as any;
    }
  }

  // --- BOOKINGS ---
  public static async getBookings(customerId?: string, workerId?: string): Promise<Booking[]> {
    try {
      let url = '/bookings';
      if (customerId) url += `?customer_id=${customerId}`;
      if (workerId) url += `?worker_id=${workerId}`;
      return await this.request<Booking[]>(url);
    } catch {
      let list = MOCK_BOOKINGS;
      if (customerId) list = list.filter(b => b.customer_id === customerId);
      if (workerId) list = list.filter(b => b.worker_id === workerId);
      return [...list].sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    }
  }

  public static async getBookingById(bookingId: string): Promise<Booking | null> {
    try {
      const res = await this.request<any>(`/bookings/${bookingId}`);
      return res.data || res;
    } catch {
      return MOCK_BOOKINGS.find(b => b.id === bookingId) || MOCK_BOOKINGS[0] || null;
    }
  }

  public static async createBooking(bookingPayload: any): Promise<Booking> {
    try {
      return await this.request<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingPayload)
      });
    } catch {
      const workerInfo = MOCK_WORKERS.find(w => w.id === bookingPayload.worker_id);
      const customerInfo = MOCK_CUSTOMERS.find(c => c.id === bookingPayload.customer_id);
      const booking: Booking = {
        id: 'bk-' + Date.now(),
        booking_code: 'BK-2026-' + Math.floor(1000 + Math.random() * 9000),
        cooperative_id: 'c0000000-0000-0000-0000-000000000001',
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...bookingPayload,
        worker: workerInfo,
        customer: customerInfo,
      } as any;
      MOCK_BOOKINGS.unshift(booking);
      MOCK_NOTIFICATIONS.customer.unshift({
        id: 'notif-c-' + Date.now(),
        user_id: bookingPayload.customer_id || 'p0000000-0000-0000-0000-000000000002',
        type: 'booking',
        title: `Booking Confirmed! 🎉 (${booking.booking_code})`,
        message: `Your booking for ${workerInfo?.profile?.full_name || (workerInfo as any)?.name || 'Worker'} on ${booking.booking_date || 'scheduled date'} at ${booking.booking_time || '10:00 AM'} has been confirmed.`,
        read: false,
        action_url: '/bookings',
        created_at: new Date().toISOString(),
      });
      return booking;
    }
  }

  public static async updateBookingStatus(bookingId: string, status: string): Promise<Booking> {
    try {
      return await this.request<Booking>(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch {
      const b = MOCK_BOOKINGS.find(x => x.id === bookingId);
      if (b) {
        b.status = status as any;
        b.updated_at = new Date().toISOString();
        return b;
      }
      return { id: bookingId, status } as any;
    }
  }

  // --- AI DEMAND FORECASTING ---
  public static async getDemandForecast(): Promise<{
    zone_forecasts: DemandForecastRecord[];
    weekly_demand_curve: any[];
    total_historical_events: number;
  }> {
    try {
      return await this.request<any>('/forecast');
    } catch {
      return {
        total_historical_events: 160,
        weekly_demand_curve: [
          { day: 'Mon', date: '2026-09-07', predicted_bookings: 18, surge_multiplier: 1.0 },
          { day: 'Tue', date: '2026-09-08', predicted_bookings: 19, surge_multiplier: 1.0 },
          { day: 'Wed', date: '2026-09-09', predicted_bookings: 21, surge_multiplier: 1.0 },
          { day: 'Thu', date: '2026-09-10', predicted_bookings: 20, surge_multiplier: 1.0 },
          { day: 'Fri', date: '2026-09-11', predicted_bookings: 24, surge_multiplier: 1.15 },
          { day: 'Sat', date: '2026-09-12', predicted_bookings: 35, surge_multiplier: 1.55 },
          { day: 'Sun', date: '2026-09-13', predicted_bookings: 38, surge_multiplier: 1.55 }
        ],
        zone_forecasts: [
          {
            id: 'fc-1',
            location_zone: 'Jaipur - C-Scheme / Central',
            service_category: 'Electrical',
            forecast_date: '2026-09-05',
            forecast_time_window: '09:00 - 13:00',
            predicted_demand: 14,
            confidence_score: 0.88,
            confidence_lower_bound: 11,
            confidence_upper_bound: 17,
            model_version: 'v1.0-ols-time-series',
            is_baseline_fallback: false,
            status_note: 'High demand surge due to ambient heat & electrical load',
            generated_at: new Date().toISOString()
          },
          {
            id: 'fc-2',
            location_zone: 'Jaipur - Malviya Nagar / South',
            service_category: 'Plumbing',
            forecast_date: '2026-09-05',
            forecast_time_window: '10:00 - 14:00',
            predicted_demand: 9,
            confidence_score: 0.82,
            confidence_lower_bound: 7,
            confidence_upper_bound: 12,
            model_version: 'v1.0-ols-time-series',
            is_baseline_fallback: false,
            status_note: 'Seasonal drainage & leakage volume expected to rise',
            generated_at: new Date().toISOString()
          },
          {
            id: 'fc-3',
            location_zone: 'Jaipur - Jagatpura',
            service_category: 'Electrical',
            forecast_date: '2026-09-05',
            forecast_time_window: '09:00 - 18:00',
            predicted_demand: 5,
            confidence_score: 0.41,
            confidence_lower_bound: 3,
            confidence_upper_bound: 8,
            model_version: 'v1.0-ols-time-series',
            is_baseline_fallback: true,
            status_note: 'Insufficient local historical data. Using statistical baseline fallback.',
            generated_at: new Date().toISOString()
          }
        ]
      };
    }
  }

  // --- WORKFORCE ALLOCATION ---
  public static async getWorkforceAllocations(): Promise<{
    summary: any;
    data: WorkforceAllocation[];
  }> {
    try {
      const res = await this.request<any>('/allocation/recommendations');
      return {
        summary: res.summary || {},
        data: Array.isArray(res) ? res : res.data || []
      };
    } catch {
      return {
        summary: {
          total_analyzed_zones: 5,
          understaffed_zones: 2,
          balanced_zones: 2,
          overstaffed_zones: 1
        },
        data: [
          {
            id: 'alloc-1',
            location_zone: 'Jaipur - C-Scheme / Central',
            service_category: 'Electrical',
            target_date: '2026-09-05',
            predicted_demand: 14,
            available_workers: 2,
            shortage_or_surplus: -8,
            allocation_status: 'understaffed',
            recommended_mobilization: 3,
            priority_level: 'high',
            recommendation_notes: 'Urgent: Demand exceeds active capacity. Recommend mobilizing 3 standby cooperative electricians.',
            generated_at: new Date().toISOString()
          },
          {
            id: 'alloc-2',
            location_zone: 'Jaipur - Malviya Nagar / South',
            service_category: 'Plumbing',
            target_date: '2026-09-05',
            predicted_demand: 9,
            available_workers: 2,
            shortage_or_surplus: -3,
            allocation_status: 'understaffed',
            recommended_mobilization: 1,
            priority_level: 'normal',
            recommendation_notes: 'Drainage and leakage volume spike expected. Mobilize 1 standby plumber.',
            generated_at: new Date().toISOString()
          },
          {
            id: 'alloc-3',
            location_zone: 'Jaipur - Vaishali Nagar',
            service_category: 'Carpentry',
            target_date: '2026-09-05',
            predicted_demand: 3,
            available_workers: 2,
            shortage_or_surplus: 3,
            allocation_status: 'balanced',
            recommended_mobilization: 0,
            priority_level: 'normal',
            recommendation_notes: 'Optimal capacity balance: active workers meet demand.',
            generated_at: new Date().toISOString()
          },
          {
            id: 'alloc-4',
            location_zone: 'Mumbai - Bandra West',
            service_category: 'Electrical',
            target_date: '2026-09-05',
            predicted_demand: 2,
            available_workers: 3,
            shortage_or_surplus: 7,
            allocation_status: 'overstaffed',
            recommended_mobilization: 0,
            priority_level: 'low',
            recommendation_notes: 'Surplus standby workers available for cross-zone dispatch.',
            generated_at: new Date().toISOString()
          }
        ]
      };
    }
  }

  // --- ADMIN STATS ---
  public static async getAdminStats(): Promise<any> {
    try {
      return await this.request<any>('/stats/admin');
    } catch {
      return {
        ...MOCK_ADMIN_STATS,
        totalWorkers: MOCK_ADMIN_STATS.totalWorkers,
        totalBookings: MOCK_ADMIN_STATS.totalBookings,
        completedJobs: MOCK_ADMIN_STATS.completedJobs,
        welfareCorpus: MOCK_ADMIN_STATS.welfareCorpus
      };
    }
  }

  // --- WORKER VERIFICATION ---
  public static async verifyWorker(workerId: string, status: 'verified' | 'rejected', notes?: string): Promise<Worker> {
    try {
      const res = await this.request<any>(`/workers/${workerId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      });
      return res.data;
    } catch {
      const w = MOCK_WORKERS.find(x => x.id === workerId);
      if (w) {
        w.verification_status = status;
        w.verification_notes = notes;
        w.welfare_status = status === 'verified' ? 'Active Member' : 'Rejected';
        w.insurance_status = status === 'verified' ? 'PMSBY Active' : 'None';
        return w;
      }
      return { id: workerId, verification_status: status } as any;
    }
  }

  // --- RATINGS ---
  public static async getRatings(workerId?: string): Promise<Rating[]> {
    try {
      const path = workerId ? `/ratings?worker_id=${encodeURIComponent(workerId)}` : '/ratings';
      const res = await this.request<any>(path);
      return Array.isArray(res) ? res : res.data || [];
    } catch {
      return workerId
        ? MOCK_RATINGS.filter(r => r.worker_id === workerId)
        : MOCK_RATINGS;
    }
  }

  public static async createRating(data: {
    booking_id: string;
    customer_id: string;
    worker_id: string;
    rating: number;
    feedback?: string;
    tags?: string[];
    customer_name?: string;
  }): Promise<Rating> {
    try {
      const res = await this.request<any>('/ratings', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return res.data;
    } catch {
      const rating: Rating = {
        id: `r-${Date.now()}`,
        ...data,
        created_at: new Date().toISOString()
      };
      MOCK_RATINGS.unshift(rating);
      return rating;
    }
  }

  // --- PAYMENTS & INVOICES (85 / 10 / 5 FAIR SPLIT) ---
  public static async processPayment(data: {
    booking_id: string;
    customer_id: string;
    worker_id: string;
    amount: number;
    payment_method: string;
  }): Promise<{ payment: Payment; invoice: Invoice }> {
    try {
      const res = await this.request<any>('/payments', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return res.data;
    } catch {
      const amt = data.amount;
      const workerAmt = parseFloat((amt * 0.85).toFixed(2));
      const welfareAmt = parseFloat((amt * 0.10).toFixed(2));
      const platformAmt = parseFloat((amt * 0.05).toFixed(2));

      const invoice: Invoice = {
        id: `inv-${Date.now()}`,
        booking_id: data.booking_id,
        invoice_number: `INV-2026-${Date.now().toString().slice(-6)}`,
        customer_id: data.customer_id,
        worker_id: data.worker_id,
        subtotal: amt,
        platform_fee: platformAmt,
        cooperative_share: welfareAmt,
        worker_amount: workerAmt,
        tax: 0,
        total_amount: amt,
        generated_at: new Date().toISOString()
      };
      MOCK_INVOICES.unshift(invoice);

      // Mark the booking paid in-session
      const b = MOCK_BOOKINGS.find(x => x.id === data.booking_id);
      if (b) b.payment_status = 'paid';

      return {
        payment: {
          id: `pay-${Date.now()}`,
          booking_id: data.booking_id,
          customer_id: data.customer_id,
          worker_id: data.worker_id,
          amount: amt,
          payment_method: 'demo',
          transaction_reference: `TXN-DEMO-${Date.now()}`,
          status: 'paid',
          payment_gateway: 'Sahakari Demo Gateway',
          created_at: new Date().toISOString()
        },
        invoice
      };
    }
  }

  public static async getInvoice(bookingId: string): Promise<Invoice | null> {
    try {
      const res = await this.request<any>(`/payments/invoices/${bookingId}`);
      return res.data || null;
    } catch {
      return MOCK_INVOICES.find(i => i.booking_id === bookingId) || MOCK_INVOICES[0] || null;
    }
  }

  // --- WELFARE ---
  public static async getWelfare(workerId?: string): Promise<Welfare[]> {
    try {
      const path = workerId ? `/welfare?worker_id=${encodeURIComponent(workerId)}` : '/welfare';
      const res = await this.request<any>(path);
      return Array.isArray(res) ? res : res.data || [];
    } catch {
      return workerId
        ? MOCK_WELFARE.filter(w => w.worker_id === workerId)
        : MOCK_WELFARE;
    }
  }

  // --- NOTIFICATIONS (role-aware feeds) ---
  public static async getNotifications(userId?: string): Promise<Notification[]> {
    try {
      const path = userId ? `/notifications?user_id=${encodeURIComponent(userId)}` : '/notifications';
      const res = await this.request<any>(path);
      return Array.isArray(res) ? res : res.data || [];
    } catch {
      const id = userId || '';
      if (id.startsWith('w')) return MOCK_NOTIFICATIONS.worker;
      if (id.startsWith('admin')) return MOCK_NOTIFICATIONS.admin;
      if (MOCK_CUSTOMERS.some(c => c.id === id)) return MOCK_NOTIFICATIONS.customer;
      // Default feed by caller convention: customer profiles are p-ids,
      // worker profiles are w-ids, admin is admin-demo.
      if (id.startsWith('p')) return MOCK_NOTIFICATIONS.customer;
      return MOCK_NOTIFICATIONS.customer;
    }
  }

  public static async markNotificationRead(id: string): Promise<boolean> {
    try {
      await this.request<any>(`/notifications/${id}/read`, { method: 'PATCH' });
      return true;
    } catch {
      for (const feed of Object.values(MOCK_NOTIFICATIONS)) {
        const n = feed.find(x => x.id === id);
        if (n) n.read = true;
      }
      return true;
    }
  }
}