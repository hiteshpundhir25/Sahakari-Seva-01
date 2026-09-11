// ==============================================================================
// SAHAKARI SATHI — ZERO-API-KEY AI ASSISTANT SERVICE
// ==============================================================================
// 100% on-device / browser-native:
// - Speech Recognition via Web Speech API (window.SpeechRecognition / webkitSpeechRecognition)
// - Text-to-Speech via Web Speech Synthesis (window.speechSynthesis)
// - Natural intent classification and automatic execution on ApiClient
// - Zero API keys, zero latency, zero cloud costs.
// ==============================================================================

import { ApiClient } from './apiClient';
import { Booking, ExtraTaskItem } from '../types';

export type AssistantIntentType =
  | 'START_WORK'
  | 'COMPLETE_WORK'
  | 'ACCEPT_JOB'
  | 'DECLINE_JOB'
  | 'DIAGNOSE_PARTS'
  | 'EARNINGS_WELFARE'
  | 'READ_ALOUD'
  | 'HELP'
  | 'UNKNOWN';

export interface AssistantActionOutcome {
  success: boolean;
  intent: AssistantIntentType;
  message: string;
  speechText: string;
  affectedBookingId?: string;
  actionTaken?: 'started' | 'completed' | 'accepted' | 'declined' | 'diagnosed' | 'info';
}

export interface WorkerAssistantContext {
  activeOnSiteJob: Booking | null;      // status === 'in_progress'
  nextCommittedJob: Booking | null;     // status === 'accepted'
  pendingJobs: Booking[];               // status === 'pending'
  collidingJobs: { booking: Booking; reason: string }[];
  todayCompletedCount: number;
  todayEarnings: number;
  recommendedAction: {
    label: string;
    description: string;
    intent: AssistantIntentType;
    bookingCode?: string;
    bookingId?: string;
  };
}

export class AIAssistantService {
  private static recognitionInstance: any = null;
  private static isListeningActive: boolean = false;

  // ---------------------------------------------------------------------------
  // 1. SPEECH-TO-TEXT (STT) — ZERO API KEYS
  // ---------------------------------------------------------------------------
  public static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public static startListening(
    onResult: (transcript: string) => void,
    onError?: (err: string) => void,
    onEnd?: () => void
  ): boolean {
    if (!this.isSpeechRecognitionSupported()) {
      if (onError) onError('Speech recognition is not supported in this browser/environment.');
      return false;
    }

    try {
      this.stopListening();
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Works well for Indian English and accented speech

      recognition.onstart = () => {
        this.isListeningActive = true;
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            onResult(transcript.trim());
          }
        }
      };

      recognition.onerror = (event: any) => {
        this.isListeningActive = false;
        if (onError) onError(event.error || 'Speech recognition error');
      };

      recognition.onend = () => {
        this.isListeningActive = false;
        if (onEnd) onEnd();
      };

      this.recognitionInstance = recognition;
      recognition.start();
      return true;
    } catch (err: any) {
      this.isListeningActive = false;
      if (onError) onError(err.message || 'Could not start microphone');
      return false;
    }
  }

  public static stopListening(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {}
      this.recognitionInstance = null;
    }
    this.isListeningActive = false;
  }

  public static isListening(): boolean {
    return this.isListeningActive;
  }

  // ---------------------------------------------------------------------------
  // 2. TEXT-TO-SPEECH (TTS) — ZERO API KEYS
  // ---------------------------------------------------------------------------
  public static isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static speak(text: string, onEnd?: () => void): void {
    if (!this.isSpeechSynthesisSupported()) return;
    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select an Indian English voice if available
      const voices = window.speechSynthesis.getVoices();
      const inVoice = voices.find(
        v => v.lang.includes('en-IN') || v.name.includes('India') || v.lang.includes('hi')
      );
      if (inVoice) {
        utterance.voice = inVoice;
      }

      if (onEnd) {
        utterance.onend = onEnd;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed', e);
    }
  }

  public static stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  // ---------------------------------------------------------------------------
  // 3. INTENT CLASSIFICATION (DETERMINISTIC NLP)
  // ---------------------------------------------------------------------------
  public static classifyIntent(input: string): AssistantIntentType {
    const s = input.toLowerCase().trim();

    // Start work
    if (
      s.includes('start') ||
      s.includes('begin') ||
      s.includes('chalu') ||
      s.includes('shuru') ||
      s.includes('kam shuru') ||
      s.includes('kaam shuru') ||
      s.includes('service start')
    ) {
      return 'START_WORK';
    }

    // Complete work
    if (
      s.includes('complete') ||
      s.includes('finish') ||
      s.includes('done') ||
      s.includes('mark complete') ||
      s.includes('pura') ||
      s.includes('poora') ||
      s.includes('khatam') ||
      s.includes('samapt')
    ) {
      return 'COMPLETE_WORK';
    }

    // Accept job
    if (
      s.includes('accept') ||
      s.includes('confirm') ||
      s.includes('approve') ||
      s.includes('take job') ||
      s.includes('swikar') ||
      s.includes('ha') ||
      s.includes('yes') ||
      s.includes('manzoor')
    ) {
      return 'ACCEPT_JOB';
    }

    // Decline job
    if (
      s.includes('decline') ||
      s.includes('reject') ||
      s.includes('cancel') ||
      s.includes('mana') ||
      s.includes('nahi')
    ) {
      return 'DECLINE_JOB';
    }

    // Diagnose extra parts / billing
    if (
      s.includes('part') ||
      s.includes('parts') ||
      s.includes('diagnose') ||
      s.includes('bill') ||
      s.includes('extra') ||
      s.includes('saman') ||
      s.includes('switchboard') ||
      s.includes('material')
    ) {
      return 'DIAGNOSE_PARTS';
    }

    // Earnings / Welfare
    if (
      s.includes('earn') ||
      s.includes('earning') ||
      s.includes('earnings') ||
      s.includes('welfare') ||
      s.includes('paisa') ||
      s.includes('kamai') ||
      s.includes('wage') ||
      s.includes('fund') ||
      s.includes('balance')
    ) {
      return 'EARNINGS_WELFARE';
    }

    // Read aloud / speak details
    if (
      s.includes('read') ||
      s.includes('speak') ||
      s.includes('listen') ||
      s.includes('sunao') ||
      s.includes('batao') ||
      s.includes('address') ||
      s.includes('detail') ||
      s.includes('kavita')
    ) {
      return 'READ_ALOUD';
    }

    // Help
    if (s.includes('help') || s.includes('madad') || s.includes('kya karu') || s.includes('what to do')) {
      return 'HELP';
    }

    return 'UNKNOWN';
  }

  // ---------------------------------------------------------------------------
  // 4. WORKER CONTEXT RESOLVER
  // ---------------------------------------------------------------------------
  public static async getWorkerContext(
    workerId: string = 'w0000000-0000-0000-0000-000000000001'
  ): Promise<WorkerAssistantContext> {
    const allBookings = await ApiClient.getBookings(workerId);

    // Active on-site job (status === 'in_progress')
    const activeOnSiteJob = allBookings.find(b => b.status === 'in_progress') || null;

    // Next committed job (status === 'accepted')
    const nextCommittedJob = allBookings.find(b => b.status === 'accepted') || null;

    // Pending jobs (status === 'pending')
    const pendingJobs = allBookings.filter(b => b.status === 'pending');

    // Detect collisions among pending jobs
    const collidingJobs: { booking: Booking; reason: string }[] = [];
    for (const pj of pendingJobs) {
      const conflict = ApiClient.checkScheduleConflict(pj, allBookings, 60);
      if (conflict.hasConflict && conflict.conflictingBooking) {
        collidingJobs.push({
          booking: pj,
          reason:
            conflict.reason ||
            `Collides with ${conflict.conflictingBooking.booking_code} (<1h buffer)`,
        });
      }
    }

    // Completed today & earnings
    const completedList = allBookings.filter(b => b.status === 'completed');
    const todayCompletedCount = completedList.length;
    const todayEarnings = completedList.reduce((sum, b) => {
      const amt = Number(b.final_amount || b.estimated_amount || 0);
      return sum + amt * 0.85; // 85% worker take-home
    }, 0);

    // Recommended immediate action
    let recommendedAction: WorkerAssistantContext['recommendedAction'];
    if (activeOnSiteJob) {
      recommendedAction = {
        label: `Complete ${activeOnSiteJob.booking_code}`,
        description: `Work is underway at ${activeOnSiteJob.address || 'location'}. Tap to complete and claim ₹${(
          Number(activeOnSiteJob.final_amount || activeOnSiteJob.estimated_amount || 0) * 0.85
        ).toFixed(0)} wage.`,
        intent: 'COMPLETE_WORK',
        bookingCode: activeOnSiteJob.booking_code,
        bookingId: activeOnSiteJob.id,
      };
    } else if (nextCommittedJob) {
      recommendedAction = {
        label: `Start ${nextCommittedJob.booking_code}`,
        description: `Confirmed for ${nextCommittedJob.customer?.full_name || 'Customer'} on ${nextCommittedJob.booking_date} at ${nextCommittedJob.booking_time}. Tap to start service!`,
        intent: 'START_WORK',
        bookingCode: nextCommittedJob.booking_code,
        bookingId: nextCommittedJob.id,
      };
    } else {
      // Look for a non-colliding pending job
      const safePending = pendingJobs.find(
        pj => !collidingJobs.some(cj => cj.booking.id === pj.id)
      );
      if (safePending) {
        recommendedAction = {
          label: `Accept ${safePending.booking_code}`,
          description: `New request for ₹${safePending.estimated_amount}. No schedule conflicts. Tap to accept!`,
          intent: 'ACCEPT_JOB',
          bookingCode: safePending.booking_code,
          bookingId: safePending.id,
        };
      } else {
        recommendedAction = {
          label: 'All Caught Up! 🎉',
          description: 'No pending or active jobs right now. Ready for upcoming assignments.',
          intent: 'EARNINGS_WELFARE',
        };
      }
    }

    return {
      activeOnSiteJob,
      nextCommittedJob,
      pendingJobs,
      collidingJobs,
      todayCompletedCount,
      todayEarnings,
      recommendedAction,
    };
  }

  // ---------------------------------------------------------------------------
  // 5. AUTONOMOUS END-TO-END EXECUTION
  // ---------------------------------------------------------------------------
  public static async executeCommand(
    commandText: string,
    workerId: string = 'w0000000-0000-0000-0000-000000000001'
  ): Promise<AssistantActionOutcome> {
    const intent = this.classifyIntent(commandText);
    const context = await this.getWorkerContext(workerId);

    switch (intent) {
      case 'START_WORK': {
        // If there's an ongoing job, cannot start another
        if (context.activeOnSiteJob) {
          const msg = `You already have on-site work underway for job ${context.activeOnSiteJob.booking_code}. Mark that job completed before starting a new one.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        // Target job to start: nextCommittedJob
        const target = context.nextCommittedJob;
        if (!target) {
          const msg = `No accepted jobs available to start. Please accept a pending booking first.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        try {
          await ApiClient.updateBookingStatus(target.id, 'in_progress');
          const custName = target.customer?.full_name || 'Customer';
          const msg = `🚀 Started service work on ${target.booking_code} for ${custName}! Your duty status shifted to "On Active Job".`;
          const speech = `Service started for ${custName}. Perform work to cooperative quality standards.`;
          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: target.id,
            actionTaken: 'started',
          };
        } catch (err: any) {
          return {
            success: false,
            intent,
            message: `Could not start work: ${err.message}`,
            speechText: `Action failed: ${err.message}`,
          };
        }
      }

      case 'COMPLETE_WORK': {
        const target = context.activeOnSiteJob || context.nextCommittedJob;
        if (!target) {
          const msg = `You don't have any active service jobs to complete.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        try {
          await ApiClient.updateBookingStatus(target.id, 'completed');
          const totalAmt = Number(target.final_amount || target.estimated_amount || 0);
          const wageAmt = (totalAmt * 0.85).toFixed(2);
          const welfareAmt = (totalAmt * 0.10).toFixed(2);
          const msg = `🎉 Job ${target.booking_code} completed! ₹${wageAmt} direct wage credited (85%), and ₹${welfareAmt} credited to your Welfare Fund (10%).`;
          const speech = `Job ${target.booking_code} marked completed. Rupee ${wageAmt} wage has been credited to your account.`;
          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: target.id,
            actionTaken: 'completed',
          };
        } catch (err: any) {
          return {
            success: false,
            intent,
            message: `Could not complete job: ${err.message}`,
            speechText: `Completion failed: ${err.message}`,
          };
        }
      }

      case 'ACCEPT_JOB': {
        // Find safe pending job (non-colliding)
        const safeJob = context.pendingJobs.find(
          pj => !context.collidingJobs.some(cj => cj.booking.id === pj.id)
        );

        if (!safeJob) {
          if (context.collidingJobs.length > 0) {
            const collisionReason = context.collidingJobs[0].reason;
            const msg = `Cannot accept pending job: ${collisionReason}. 1-hour buffer is required between jobs.`;
            return {
              success: false,
              intent,
              message: msg,
              speechText: `Job cannot be accepted due to a schedule clash with your existing jobs.`,
            };
          }
          const msg = `No pending job requests waiting to be accepted.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        try {
          await ApiClient.updateBookingStatus(safeJob.id, 'accepted');
          const msg = `✅ Accepted job ${safeJob.booking_code} (${safeJob.booking_date} at ${safeJob.booking_time})! Value: ₹${safeJob.estimated_amount}.`;
          const speech = `Job ${safeJob.booking_code} accepted for ${safeJob.booking_date} at ${safeJob.booking_time}.`;
          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: safeJob.id,
            actionTaken: 'accepted',
          };
        } catch (err: any) {
          return {
            success: false,
            intent,
            message: `Could not accept job: ${err.message}`,
            speechText: `Could not accept job: ${err.message}`,
          };
        }
      }

      case 'DECLINE_JOB': {
        const target = context.pendingJobs[0];
        if (!target) {
          const msg = `No pending job requests to decline.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        try {
          await ApiClient.updateBookingStatus(target.id, 'rejected');
          const msg = `Request ${target.booking_code} declined.`;
          const speech = `Job request ${target.booking_code} declined.`;
          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: target.id,
            actionTaken: 'declined',
          };
        } catch (err: any) {
          return {
            success: false,
            intent,
            message: `Could not decline: ${err.message}`,
            speechText: `Action failed: ${err.message}`,
          };
        }
      }

      case 'DIAGNOSE_PARTS': {
        const target = context.activeOnSiteJob || context.nextCommittedJob;
        if (!target) {
          const msg = `No active job to attach diagnostic parts to. Start a job first.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        try {
          const sampleItem: ExtraTaskItem = {
            id: 'extra-' + Date.now(),
            title: 'Modular Switchboard & High-Amp Wiring Kit',
            description: 'Replacement heavy-duty brass socket + conduit wiring',
            cost: 350,
            type: 'part',
          };
          await ApiClient.sendSupplementalBill(target.id, {
            diagnosis_notes: 'Detected oxidized wiring and damaged switch terminals during inspection.',
            items: [sampleItem],
          });
          const msg = `🔧 Diagnostic bill of ₹350 sent to customer for job ${target.booking_code}. Awaiting authorization.`;
          const speech = `Diagnostic estimate of 350 rupees sent to customer for authorization.`;
          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: target.id,
            actionTaken: 'diagnosed',
          };
        } catch (err: any) {
          return {
            success: false,
            intent,
            message: `Diagnostic billing error: ${err.message}`,
            speechText: `Could not send diagnostic bill.`,
          };
        }
      }

      case 'EARNINGS_WELFARE': {
        const total = context.todayEarnings.toFixed(0);
        const count = context.todayCompletedCount;
        const msg = `💰 Today's Summary: ${count} completed jobs, ₹${total} earned (85% take-home). 10% automatically deposited to Cooperative Welfare Fund.`;
        const speech = `You have completed ${count} jobs today with total earnings of ${total} rupees.`;
        return {
          success: true,
          intent,
          message: msg,
          speechText: speech,
          actionTaken: 'info',
        };
      }

      case 'READ_ALOUD': {
        const target = context.activeOnSiteJob || context.nextCommittedJob || context.pendingJobs[0];
        if (!target) {
          const msg = `No active or scheduled jobs to read out right now.`;
          return {
            success: true,
            intent,
            message: msg,
            speechText: msg,
            actionTaken: 'info',
          };
        }

        const cust = target.customer?.full_name || 'Customer';
        const addr = target.address || 'Address on file';
        const date = target.booking_date;
        const time = target.booking_time;
        const wage = (Number(target.final_amount || target.estimated_amount || 0) * 0.85).toFixed(0);
        const desc = target.service_description || 'Standard maintenance';

        const msg = `📋 ${target.booking_code} | Customer: ${cust} | 📍 ${addr} | ⏰ ${date} at ${time} | Expected Wage: ₹${wage} | Description: "${desc}"`;
        const speech = `Job order ${target.booking_code}. Customer ${cust}, at ${addr}. Scheduled for ${date} at ${time}. Your direct wage is ${wage} rupees. Work description: ${desc}.`;

        return {
          success: true,
          intent,
          message: msg,
          speechText: speech,
          affectedBookingId: target.id,
          actionTaken: 'info',
        };
      }

      case 'HELP':
      default: {
        const rec = context.recommendedAction.label;
        const msg = `💡 Sahakari Sathi can execute any action automatically! You can tap or say: "Start work", "Complete job", "Accept job", "Add ₹350 parts", "Read details aloud", or "My earnings". Recommended next: ${rec}.`;
        const speech = `I am your Sahakari Sathi. You can say start work, complete job, read details, or check earnings.`;
        return {
          success: true,
          intent: 'HELP',
          message: msg,
          speechText: speech,
          actionTaken: 'info',
        };
      }
    }
  }
}
