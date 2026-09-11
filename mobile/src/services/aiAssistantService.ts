// ==============================================================================
// SAHAKARI ASSISTANT SERVICE — CONVERSATIONAL & AUTOMATION ENGINE
// ==============================================================================
// - Speech Recognition via Web Speech API (SpeechRecognition / webkitSpeechRecognition)
// - Text-to-Speech via Web Speech Synthesis (window.speechSynthesis)
// - Context-aware intent matching and direct execution on ApiClient
// - Global cross-screen synchronization via DeviceEventEmitter
// ==============================================================================

import { DeviceEventEmitter } from 'react-native';
import { ApiClient } from './apiClient';
import { Booking, ExtraTaskItem } from '../types';

export type AssistantIntentType =
  | 'START_WORK'
  | 'COMPLETE_WORK'
  | 'ACCEPT_JOB'
  | 'DECLINE_JOB'
  | 'DIAGNOSE_PARTS'
  | 'LIST_JOBS'
  | 'CUSTOMER_INFO'
  | 'EARNINGS_WELFARE'
  | 'READ_ALOUD'
  | 'HELP'
  | 'UNKNOWN';

export interface AssistantActionCard {
  id: string;
  type: 'action_buttons' | 'job_summary' | 'earnings_summary';
  booking?: Booking;
  actions?: {
    label: string;
    command: string;
    icon?: string;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  }[];
}

export interface AssistantMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  card?: AssistantActionCard;
}

export interface AssistantActionOutcome {
  success: boolean;
  intent: AssistantIntentType;
  message: string;
  speechText: string;
  card?: AssistantActionCard;
  affectedBookingId?: string;
  actionTaken?: 'started' | 'completed' | 'accepted' | 'declined' | 'diagnosed' | 'info';
}

export interface WorkerAssistantContext {
  activeOnSiteJob: Booking | null;      // status === 'in_progress'
  nextCommittedJob: Booking | null;     // status === 'accepted'
  pendingJobs: Booking[];               // status === 'pending'
  allJobs: Booking[];
  todayCompletedCount: number;
  todayEarnings: number;
}

export class AIAssistantService {
  private static recognitionInstance: any = null;
  private static isListeningActive: boolean = false;

  // ---------------------------------------------------------------------------
  // 1. SPEECH-TO-TEXT (STT)
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
      if (onError) onError('Voice input is not supported in this browser. Please use the quick action buttons.');
      return false;
    }

    try {
      this.stopListening();
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Works for Indian English and accented speech

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
        // Ignore silent "no-speech" events without displaying noisy alerts
        if (event.error === 'no-speech') {
          if (onEnd) onEnd();
          return;
        }
        if (onError) onError(event.error || 'Microphone error');
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
      if (onError) onError(err.message || 'Could not access microphone');
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
  // 2. TEXT-TO-SPEECH (TTS)
  // ---------------------------------------------------------------------------
  public static isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static speak(text: string, onEnd?: () => void): void {
    if (!this.isSpeechSynthesisSupported()) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        v => v.lang.includes('en-IN') || v.name.includes('India') || v.lang.includes('hi')
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      if (onEnd) {
        utterance.onend = onEnd;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis unavailable', e);
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
  // 3. INTENT CLASSIFICATION
  // ---------------------------------------------------------------------------
  public static classifyIntent(input: string): AssistantIntentType {
    const s = input.toLowerCase().trim();

    // Start work
    if (
      s.includes('start') ||
      s.includes('begin') ||
      s.includes('chalu') ||
      s.includes('shuru') ||
      s.includes('service start') ||
      s.includes('kaam shuru')
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
      s.includes('switchboard')
    ) {
      return 'DIAGNOSE_PARTS';
    }

    // Customer info / contact
    if (
      s.includes('call') ||
      s.includes('phone') ||
      s.includes('customer') ||
      s.includes('contact') ||
      s.includes('kavita') ||
      s.includes('address') ||
      s.includes('location') ||
      s.includes('map') ||
      s.includes('pata')
    ) {
      return 'CUSTOMER_INFO';
    }

    // List all jobs / schedule
    if (
      s.includes('job') ||
      s.includes('jobs') ||
      s.includes('schedule') ||
      s.includes('booking') ||
      s.includes('bookings') ||
      s.includes('list') ||
      s.includes('kaam') ||
      s.includes('what to do')
    ) {
      return 'LIST_JOBS';
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
      s.includes('balance') ||
      s.includes('fund')
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
      s.includes('bol kar')
    ) {
      return 'READ_ALOUD';
    }

    // Help
    if (s.includes('help') || s.includes('madad') || s.includes('sahayata')) {
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
    const allBookings = await ApiClient.getBookings(undefined, workerId);

    const activeOnSiteJob = allBookings.find(b => b.status === 'in_progress') || null;
    const nextCommittedJob = allBookings.find(b => b.status === 'accepted') || null;
    const pendingJobs = allBookings.filter(b => b.status === 'pending');

    const completedList = allBookings.filter(b => b.status === 'completed');
    const todayCompletedCount = completedList.length;
    const todayEarnings = completedList.reduce((sum, b) => {
      const amt = Number(b.final_amount || b.estimated_amount || 0);
      return sum + amt * 0.85;
    }, 0);

    return {
      activeOnSiteJob,
      nextCommittedJob,
      pendingJobs,
      allJobs: allBookings,
      todayCompletedCount,
      todayEarnings,
    };
  }

  // ---------------------------------------------------------------------------
  // 5. AUTONOMOUS COMMAND EXECUTION
  // ---------------------------------------------------------------------------
  public static async executeCommand(
    commandText: string,
    workerId: string = 'w0000000-0000-0000-0000-000000000001'
  ): Promise<AssistantActionOutcome> {
    const intent = this.classifyIntent(commandText);
    const context = await this.getWorkerContext(workerId);

    switch (intent) {
      case 'START_WORK': {
        if (context.activeOnSiteJob) {
          const msg = `You already have on-site work underway for job ${context.activeOnSiteJob.booking_code}. Mark that job completed before starting another one.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
            card: {
              id: 'card-active-' + Date.now(),
              type: 'action_buttons',
              booking: context.activeOnSiteJob,
              actions: [
                { label: `✓ Complete ${context.activeOnSiteJob.booking_code}`, command: `complete job`, variant: 'success' },
                { label: '🔧 Add Extra Parts', command: 'add diagnostic parts', variant: 'primary' },
              ],
            },
          };
        }

        const target = context.nextCommittedJob;
        if (!target) {
          const msg = `No accepted jobs ready to start right now. You can review pending requests.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
            card: context.pendingJobs.length > 0 ? {
              id: 'card-pending-' + Date.now(),
              type: 'action_buttons',
              booking: context.pendingJobs[0],
              actions: [
                { label: `Accept ${context.pendingJobs[0].booking_code}`, command: 'accept job', variant: 'primary' },
              ],
            } : undefined,
          };
        }

        try {
          await ApiClient.updateBookingStatus(target.id, 'in_progress');
          // Broadcast app-wide update event so background screens refresh immediately!
          DeviceEventEmitter.emit('app_booking_updated');

          const custName = target.customer?.full_name || 'Customer';
          const wage = (Number(target.final_amount || target.estimated_amount || 0) * 0.85).toFixed(0);
          const msg = `⚡ Service work started on ${target.booking_code} for ${custName}! Your duty status shifted to "On Active Job". Expected wage: ₹${wage}.`;
          const speech = `Service work started for ${custName}. Perform work according to cooperative quality standards.`;

          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: target.id,
            actionTaken: 'started',
            card: {
              id: 'card-started-' + Date.now(),
              type: 'action_buttons',
              booking: target,
              actions: [
                { label: '🔧 Add Extra Parts (+₹350)', command: 'add diagnostic parts', variant: 'warning' },
                { label: `✓ Complete Job (Claim ₹${wage})`, command: 'complete job', variant: 'success' },
                { label: '📞 Call Customer', command: 'customer contact', variant: 'neutral' },
              ],
            },
          };
        } catch (err: any) {
          return {
            success: false,
            intent,
            message: `Could not start work: ${err.message}`,
            speechText: `Could not start work: ${err.message}`,
          };
        }
      }

      case 'COMPLETE_WORK': {
        const target = context.activeOnSiteJob || context.nextCommittedJob;
        if (!target) {
          const msg = `You don't have any active service jobs to complete right now.`;
          return {
            success: false,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        try {
          await ApiClient.updateBookingStatus(target.id, 'completed');
          // Broadcast app-wide update event
          DeviceEventEmitter.emit('app_booking_updated');

          const totalAmt = Number(target.final_amount || target.estimated_amount || 0);
          const wageAmt = (totalAmt * 0.85).toFixed(2);
          const welfareAmt = (totalAmt * 0.10).toFixed(2);
          const msg = `🎉 Job ${target.booking_code} completed! ₹${wageAmt} direct wage credited (85%), and ₹${welfareAmt} credited to your Welfare Fund (10%).`;
          const speech = `Job ${target.booking_code} marked completed. ₹${wageAmt} direct wage credited.`;

          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: target.id,
            actionTaken: 'completed',
            card: {
              id: 'card-comp-' + Date.now(),
              type: 'earnings_summary',
              booking: target,
              actions: [
                { label: '💰 Check Full Earnings', command: 'earnings summary', variant: 'primary' },
                { label: '📋 View Remaining Jobs', command: 'my jobs', variant: 'neutral' },
              ],
            },
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
        const safeJob = context.pendingJobs.find(pj => {
          const conflict = ApiClient.checkScheduleConflict(pj, context.allJobs, 60);
          return !conflict.hasConflict;
        });

        if (!safeJob) {
          if (context.pendingJobs.length > 0) {
            const msg = `The pending job collides with your existing schedule (1-hour buffer required). It cannot be accepted.`;
            return {
              success: false,
              intent,
              message: msg,
              speechText: `Job cannot be accepted due to a schedule clash.`,
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
          DeviceEventEmitter.emit('app_booking_updated');

          const msg = `✅ Accepted job ${safeJob.booking_code} scheduled for ${safeJob.booking_date} at ${safeJob.booking_time}! Value: ₹${safeJob.estimated_amount}.`;
          const speech = `Job ${safeJob.booking_code} accepted for ${safeJob.booking_date} at ${safeJob.booking_time}.`;

          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: safeJob.id,
            actionTaken: 'accepted',
            card: {
              id: 'card-accepted-' + Date.now(),
              type: 'action_buttons',
              booking: safeJob,
              actions: [
                { label: `⚡ Start ${safeJob.booking_code}`, command: `start work on ${safeJob.booking_code}`, variant: 'success' },
                { label: '📞 Customer Details', command: 'customer contact', variant: 'neutral' },
              ],
            },
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
          DeviceEventEmitter.emit('app_booking_updated');

          const msg = `Job request ${target.booking_code} has been declined.`;
          const speech = `Request ${target.booking_code} declined.`;

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
          const msg = `You need an active job to attach diagnostic parts. Start service work first.`;
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
            title: 'Modular Switchboard & Wiring Kit',
            description: 'Replacement heavy-duty brass socket + conduit wiring',
            cost: 350,
            type: 'part',
          };
          await ApiClient.sendSupplementalBill(target.id, {
            diagnosis_notes: 'Detected oxidized wiring and damaged switch terminals during on-site inspection.',
            items: [sampleItem],
          });
          DeviceEventEmitter.emit('app_booking_updated');

          const msg = `🔧 Diagnostic bill of ₹350 sent to customer for job ${target.booking_code}. The customer will be prompted to authorize.`;
          const speech = `Diagnostic estimate of 350 rupees sent to customer for authorization.`;

          return {
            success: true,
            intent,
            message: msg,
            speechText: speech,
            affectedBookingId: target.id,
            actionTaken: 'diagnosed',
            card: {
              id: 'card-diag-' + Date.now(),
              type: 'action_buttons',
              booking: target,
              actions: [
                { label: '✓ Complete Job When Ready', command: 'complete job', variant: 'success' },
                { label: '📞 Call Customer', command: 'customer contact', variant: 'neutral' },
              ],
            },
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

      case 'CUSTOMER_INFO': {
        const target = context.activeOnSiteJob || context.nextCommittedJob || context.pendingJobs[0];
        if (!target) {
          const msg = `No active or upcoming jobs on file to show customer details.`;
          return {
            success: true,
            intent,
            message: msg,
            speechText: msg,
          };
        }

        const custName = target.customer?.full_name || 'Kavita Reddy';
        const phone = target.customer?.phone || '+91 98550 44556';
        const addr = target.address || 'Plot 21, Jagatpura, Jaipur, Rajasthan - 302027';

        const msg = `👤 Customer: ${custName}\n📞 Phone: ${phone}\n📍 Address: ${addr}\n📋 Job: ${target.booking_code} (${target.service_description})`;
        const speech = `Customer is ${custName}, phone ${phone}, address ${addr}.`;

        return {
          success: true,
          intent,
          message: msg,
          speechText: speech,
          card: {
            id: 'card-cust-' + Date.now(),
            type: 'action_buttons',
            booking: target,
            actions: [
              { label: target.status === 'in_progress' ? '✓ Complete Job' : '⚡ Start Service Work', command: target.status === 'in_progress' ? 'complete job' : 'start work', variant: 'success' },
              { label: '🔊 Read Aloud', command: 'read details aloud', variant: 'neutral' },
            ],
          },
        };
      }

      case 'LIST_JOBS': {
        const inProgress = context.activeOnSiteJob;
        const accepted = context.nextCommittedJob;
        const pending = context.pendingJobs;

        let msg = `📋 Here is your current work schedule:\n`;
        if (inProgress) {
          msg += `• ⚡ IN PROGRESS: ${inProgress.booking_code} (${inProgress.customer?.full_name || 'Customer'} - ₹${(Number(inProgress.final_amount || inProgress.estimated_amount) * 0.85).toFixed(0)} wage)\n`;
        }
        if (accepted) {
          msg += `• 📋 CONFIRMED: ${accepted.booking_code} (${accepted.booking_date} at ${accepted.booking_time} - ₹${(Number(accepted.final_amount || accepted.estimated_amount) * 0.85).toFixed(0)} wage)\n`;
        }
        if (pending.length > 0) {
          msg += `• 🔔 PENDING: ${pending.length} new booking request(s)\n`;
        }
        if (!inProgress && !accepted && pending.length === 0) {
          msg += `You have no pending or scheduled jobs right now. All caught up!`;
        }

        const speech = inProgress
          ? `You have job ${inProgress.booking_code} actively in progress.`
          : accepted
          ? `You have job ${accepted.booking_code} confirmed and ready to start.`
          : `You have ${pending.length} pending requests.`;

        const primaryTarget = inProgress || accepted || pending[0];

        return {
          success: true,
          intent,
          message: msg.trim(),
          speechText: speech,
          card: primaryTarget ? {
            id: 'card-list-' + Date.now(),
            type: 'action_buttons',
            booking: primaryTarget,
            actions: [
              ...(inProgress ? [{ label: `✓ Complete ${inProgress.booking_code}`, command: 'complete job', variant: 'success' as const }] : []),
              ...(accepted && !inProgress ? [{ label: `⚡ Start ${accepted.booking_code}`, command: 'start work', variant: 'success' as const }] : []),
              ...(pending.length > 0 && !inProgress ? [{ label: `Accept ${pending[0].booking_code}`, command: 'accept job', variant: 'primary' as const }] : []),
              { label: '💰 Check Earnings', command: 'earnings summary', variant: 'neutral' as const },
            ],
          } : undefined,
        };
      }

      case 'EARNINGS_WELFARE': {
        const total = context.todayEarnings.toFixed(0);
        const count = context.todayCompletedCount;
        const welfareEstimate = (context.todayEarnings * 0.10 / 0.85).toFixed(0);

        const msg = `💰 Earnings Summary:\n• Completed Jobs: ${count}\n• Direct Wages Earned (85%): ₹${total}\n• Welfare Fund Contribution (10%): ₹${welfareEstimate}\n• Cooperative Protection: Active 🛡️`;
        const speech = `You have completed ${count} jobs with direct earnings of ${total} rupees.`;

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
          };
        }

        const cust = target.customer?.full_name || 'Customer';
        const addr = target.address || 'Address on file';
        const date = target.booking_date;
        const time = target.booking_time;
        const wage = (Number(target.final_amount || target.estimated_amount || 0) * 0.85).toFixed(0);
        const desc = target.service_description || 'Standard service work';

        const msg = `📋 Order ${target.booking_code}\n• Customer: ${cust}\n• Location: ${addr}\n• Time: ${date} at ${time}\n• Direct Wage: ₹${wage}\n• Work: ${desc}`;
        const speech = `Job order ${target.booking_code} for ${cust}, at ${addr}. Scheduled for ${date} at ${time}. Your direct wage is ${wage} rupees.`;

        return {
          success: true,
          intent,
          message: msg,
          speechText: speech,
          affectedBookingId: target.id,
          card: {
            id: 'card-read-' + Date.now(),
            type: 'action_buttons',
            booking: target,
            actions: [
              { label: target.status === 'in_progress' ? '✓ Complete Job' : '⚡ Start Service Work', command: target.status === 'in_progress' ? 'complete job' : 'start work', variant: 'success' },
            ],
          },
        };
      }

      case 'HELP':
      default: {
        const inProg = context.activeOnSiteJob;
        const accepted = context.nextCommittedJob;
        const recText = inProg
          ? `You have job ${inProg.booking_code} in progress. You can say 'complete job' or 'add parts'.`
          : accepted
          ? `You have job ${accepted.booking_code} confirmed. You can say 'start work' to begin.`
          : `You can check your schedule, accept requests, or view earnings.`;

        const msg = `💡 I am your Sahakari Assistant. Here is what you can do:\n${recText}\n\nTap any action below or speak your command.`;
        const speech = `I am your Sahakari Assistant. ${recText}`;

        const primary = inProg || accepted || context.pendingJobs[0];

        return {
          success: true,
          intent: 'HELP',
          message: msg,
          speechText: speech,
          card: primary ? {
            id: 'card-help-' + Date.now(),
            type: 'action_buttons',
            booking: primary,
            actions: [
              ...(inProg ? [{ label: `✓ Complete ${inProg.booking_code}`, command: 'complete job', variant: 'success' as const }] : []),
              ...(accepted && !inProg ? [{ label: `⚡ Start ${accepted.booking_code}`, command: 'start work', variant: 'success' as const }] : []),
              { label: '📋 Show My Jobs', command: 'my jobs', variant: 'neutral' as const },
              { label: '💰 My Earnings', command: 'earnings summary', variant: 'neutral' as const },
            ],
          } : undefined,
        };
      }
    }
  }
}
