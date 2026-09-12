// ==============================================================================
// SUPPLEMENTAL BILL MODAL — SERVICE WORKER DIAGNOSIS & EXTRA TASKS BUILDER
// Allows service workers to document newly discovered defects upon arrival,
// itemize additional tasks & spare parts, generate an estimate, and send it
// directly to the customer's profile for real-time authorization.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  Wrench,
  Plus,
  Trash2,
  AlertTriangle,
  X,
  Send,
  Sparkles,
  PackageCheck,
  Tag,
  IndianRupee,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { Palette } from '../../theme';
import { Booking, ExtraTaskItem, ExtraTaskType } from '../../types';

interface SupplementalBillModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSubmit: (billData: { diagnosis_notes: string; items: ExtraTaskItem[] }) => Promise<void>;
}

// Preset common defect suggestions mapped by trade category
export const TRADE_SUGGESTIONS: Record<string, Array<{ title: string; cost: number; type: ExtraTaskType }>> = {
  Electrical: [
    { title: '16A Heavy-Duty Modular Switch Replacement', cost: 150, type: 'part' },
    { title: '6A / 10A Standard Switch / Socket Plate', cost: 95, type: 'part' },
    { title: 'Heavy-Duty 2.5µF / 3.15µF Motor Capacitor', cost: 180, type: 'part' },
    { title: 'Single-Pole 16A/32A MCB Breaker', cost: 240, type: 'part' },
    { title: 'Ceiling Fan Step-Regulator Replacement', cost: 160, type: 'part' },
    { title: 'LED Concealed Driver / Choke Unit', cost: 210, type: 'part' },
    { title: 'Terminal Block Rewiring & Insulation', cost: 120, type: 'repair' },
    { title: 'Short-Circuit Fault Tracing & MCB Isolation', cost: 200, type: 'labor' },
    { title: 'Copper Earthing & Neutral Wire Balancing', cost: 280, type: 'labor' },
  ],
  Plumbing: [
    { title: 'Brass Angle Cock Valve Replacement', cost: 240, type: 'part' },
    { title: 'Under-Sink PVC S-Trap & Waste Pipe Assembly', cost: 190, type: 'part' },
    { title: 'Ceramic Disc Cartridge / Spindle for Mixer Tap', cost: 160, type: 'part' },
    { title: 'CPVC Pipe Section Extension & Coupler', cost: 180, type: 'repair' },
    { title: 'Water Tank Float Ball Valve Assembly', cost: 320, type: 'part' },
    { title: 'Brass Bibcock Heavy Water Tap', cost: 260, type: 'part' },
    { title: 'High-Pressure Teflon Joint Sealing & Re-threading', cost: 110, type: 'repair' },
    { title: 'Deep Concealed Line Blockage Extraction', cost: 220, type: 'labor' },
  ],
  Carpentry: [
    { title: 'Door Mortise Lock & Cylinder Replacement', cost: 380, type: 'part' },
    { title: 'Hydraulic Soft-Close Cabinet Hinges (Pair)', cost: 220, type: 'part' },
    { title: 'Heavy-Duty Ball Bearing Drawer Channel (Pair)', cost: 290, type: 'part' },
    { title: 'Magnetic Door Stopper & Tower Bolt Fitting', cost: 130, type: 'part' },
    { title: 'Wood Planing & Door Frame Re-alignment', cost: 160, type: 'labor' },
    { title: 'Plywood Reinforcement & Structural Patching', cost: 240, type: 'repair' },
  ],
  Painting: [
    { title: 'Waterproof Wall Putty & Primer Patching', cost: 280, type: 'repair' },
    { title: 'Anti-Damp Chemical Barrier Coating', cost: 350, type: 'part' },
    { title: 'Deep Wall Crack Mesh & Polymer Filler', cost: 190, type: 'repair' },
    { title: 'Enamel Touch-Up & Surface Sanding', cost: 150, type: 'labor' },
    { title: 'Fungicidal Anti-Mold Wash & Seal', cost: 220, type: 'labor' },
  ],
  'Cleaning & Sanitization': [
    { title: 'Hospital-Grade Antibacterial Disinfectant Chemical', cost: 220, type: 'part' },
    { title: 'Heavy Kitchen Grease Degreaser Solution', cost: 180, type: 'part' },
    { title: 'Bathroom Hard-Water Descaling Acid Wash', cost: 190, type: 'repair' },
    { title: 'Deep Upholstery Foam Extraction Treatment', cost: 260, type: 'labor' },
    { title: 'High-Pressure Steam Sanitization Pass', cost: 280, type: 'labor' },
  ],
  'Gardening & Landscaping': [
    { title: 'Organic Vermicompost & Nutrient Pack (5kg)', cost: 210, type: 'part' },
    { title: 'Neem Oil Anti-Pest Foliar Spray Solution', cost: 160, type: 'repair' },
    { title: 'Drip Micro-Irrigation Nozzle Replacement Kit', cost: 150, type: 'part' },
    { title: 'Precision Hedge Pruning & Shrub Shaping', cost: 240, type: 'labor' },
    { title: 'Soil Tilling & Root Zone Aeration', cost: 180, type: 'labor' },
  ],
  'Appliance Repair': [
    { title: 'OEM Thermostat Switch Replacement', cost: 320, type: 'part' },
    { title: 'Water Inlet Solenoid Valve Fix', cost: 260, type: 'part' },
    { title: 'Heavy-Duty Universal Drain Pump Unit', cost: 390, type: 'part' },
    { title: 'Mica Sheet & Magnetron Diode Set', cost: 210, type: 'part' },
    { title: 'Tub Drive Belt & Pulley Tensioning', cost: 190, type: 'repair' },
    { title: 'Motor Bushing Alignment & High-Temp Greasing', cost: 180, type: 'labor' },
  ],
  'AC Repair & Servicing': [
    { title: 'Dual Run 35µF/45µF Compressor Capacitor', cost: 450, type: 'part' },
    { title: 'Refrigerant Gas Top-Up (R32/R410A)', cost: 650, type: 'part' },
    { title: 'Copper Flare Nut & Joint Re-brazing', cost: 350, type: 'repair' },
    { title: 'Contactor Relay & PCB Sensor Probe Fix', cost: 380, type: 'repair' },
    { title: 'Drain Tray & Condensate Line De-clog', cost: 180, type: 'labor' },
    { title: 'Blower Motor Bearings & Impeller De-dust', cost: 220, type: 'labor' },
  ],
  'Driver Services': [
    { title: 'Toll, Parking & State Tax Settlement', cost: 250, type: 'part' },
    { title: 'Vehicle Exterior Foam Jet Wash & Vacuum', cost: 220, type: 'labor' },
    { title: 'Night Driving Extended Shift Surcharge', cost: 200, type: 'labor' },
    { title: 'Multi-Stop Unscheduled Route Deviation', cost: 150, type: 'labor' },
  ],
  'Caregiving & Nursing': [
    { title: 'Sterile Dressing & Antiseptic Bandage Kit', cost: 180, type: 'part' },
    { title: 'Vitals & Blood Glucose Diagnostic Strips Kit', cost: 160, type: 'part' },
    { title: 'Mobility Assistance & Transfer Support Surcharge', cost: 200, type: 'labor' },
    { title: 'Emergency Clinic Accompaniment & Escort', cost: 280, type: 'labor' },
  ],
};

export const DEFAULT_SUGGESTIONS: Array<{ title: string; cost: number; type: ExtraTaskType }> = [
  { title: 'Defective Core Component Replacement', cost: 250, type: 'part' },
  { title: 'Emergency Deep Labor & Refitting', cost: 180, type: 'labor' },
  { title: 'Protective Safety Re-alignment & Testing', cost: 120, type: 'repair' },
];

export const SupplementalBillModal: React.FC<SupplementalBillModalProps> = ({
  visible,
  booking,
  onClose,
  onSubmit,
}) => {
  const { isDark, colors } = useTheme();
  const styles = createStyles(colors, isDark);

  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [items, setItems] = useState<ExtraTaskItem[]>([
    {
      id: 'item-' + Date.now(),
      title: '',
      cost: 0,
      type: 'part',
    },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const initialTrade = booking?.service_category?.name || 'Electrical';
  const [selectedTrade, setSelectedTrade] = useState<string>(initialTrade);

  useEffect(() => {
    if (booking?.service_category?.name) {
      setSelectedTrade(booking.service_category.name);
    }
  }, [booking]);

  const suggestions = TRADE_SUGGESTIONS[selectedTrade] || DEFAULT_SUGGESTIONS;

  useEffect(() => {
    if (visible) {
      setDiagnosisNotes('');
      setItems([
        {
          id: 'item-' + Date.now(),
          title: '',
          cost: 0,
          type: 'part',
        },
      ]);
      setSubmitting(false);
    }
  }, [visible]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        title: '',
        cost: 0,
        type: 'part',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      Alert.alert('Notice', 'At least one itemized task or part is required.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof ExtraTaskItem, val: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleApplySuggestion = (sug: { title: string; cost: number; type: ExtraTaskType }) => {
    // If the first item is empty, replace it; otherwise append
    if (items.length === 1 && !items[0].title.trim() && items[0].cost === 0) {
      setItems([
        {
          id: items[0].id,
          title: sug.title,
          cost: sug.cost,
          type: sug.type,
        },
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          title: sug.title,
          cost: sug.cost,
          type: sug.type,
        },
      ]);
    }
  };

  const extraSubtotal = items.reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
  const baseAmount = Number(booking?.estimated_amount) || Number(booking?.final_amount) || 0;
  const newGrandTotal = baseAmount + extraSubtotal;

  const handleSendBill = async () => {
    if (!diagnosisNotes.trim()) {
      Alert.alert(
        'Inspection Notes Required',
        'Please describe the physical defect or issues discovered on the item so the customer understands why extra work is needed.'
      );
      return;
    }

    const validItems = items.filter((it) => it.title.trim().length > 0 && it.cost > 0);
    if (validItems.length === 0) {
      Alert.alert(
        'Valid Line Items Required',
        'Please specify at least one extra task or part with a valid cost.'
      );
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        diagnosis_notes: diagnosisNotes.trim(),
        items: validItems,
      });
      onClose();
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Could not send bill to customer profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Wrench size={18} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Diagnose Additional Issues</Text>
                <Text style={styles.modalSub}>
                  {booking?.booking_code} • {booking?.customer?.full_name || 'Customer'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Context Callout */}
            <View style={styles.calloutBox}>
              <AlertTriangle size={15} color="#f59e0b" style={{ marginTop: 2 }} />
              <Text style={styles.calloutText}>
                Discovered defects beyond the requested service? Itemize the required repairs and parts below. This will be sent directly to the customer's phone for approval before you proceed.
              </Text>
            </View>

            {/* Diagnosis Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PHYSICAL DIAGNOSIS & DISCOVERED ISSUES *</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="e.g. During inspection, found burnt primary capacitor and damaged wire harness..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={diagnosisNotes}
                onChangeText={setDiagnosisNotes}
              />
            </View>

            {/* Quick Suggestions Chips */}
            <View style={styles.section}>
              <View style={styles.chipHeaderRow}>
                <Sparkles size={12} color="#10b981" />
                <Text style={styles.chipSectionLabel}>BROWSE CATALOG BY TRADE ({selectedTrade.toUpperCase()})</Text>
              </View>

              {/* Trade switcher pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tradeCategoryScroll}>
                {Object.keys(TRADE_SUGGESTIONS).map((tr) => (
                  <TouchableOpacity
                    key={tr}
                    style={[
                      styles.tradeTabPill,
                      selectedTrade === tr && styles.tradeTabPillActive,
                    ]}
                    onPress={() => setSelectedTrade(tr)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.tradeTabPillText,
                        selectedTrade === tr && styles.tradeTabPillTextActive,
                      ]}
                    >
                      {tr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {suggestions.map((sug, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => handleApplySuggestion(sug)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.chipText}>{sug.title}</Text>
                    <Text style={styles.chipPrice}>+₹{sug.cost}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Itemized Tasks & Parts List */}
            <View style={styles.section}>
              <View style={styles.itemHeaderRow}>
                <Text style={styles.sectionLabel}>ITEMIZED EXTRA WORK & PARTS *</Text>
                <TouchableOpacity onPress={handleAddItem} style={styles.addInlineBtn}>
                  <Plus size={13} color="#10b981" />
                  <Text style={styles.addInlineText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {items.map((item, index) => (
                <View key={item.id} style={styles.itemRowCard}>
                  <View style={styles.itemTopRow}>
                    <Text style={styles.itemIndex}>#{index + 1}</Text>
                    {/* Type Selector Pill */}
                    <View style={styles.typePillRow}>
                      {(['part', 'labor', 'repair'] as ExtraTaskType[]).map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[
                            styles.typePill,
                            item.type === t && styles.typePillActive,
                          ]}
                          onPress={() => handleUpdateItem(item.id, 'type', t)}
                        >
                          <Text
                            style={[
                              styles.typePillText,
                              item.type === t && styles.typePillTextActive,
                            ]}
                          >
                            {t === 'part' ? 'Spare Part' : t === 'labor' ? 'Labor' : 'Repair'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      onPress={() => handleRemoveItem(item.id)}
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={15} color={colors.danger} />
                    </TouchableOpacity>
                  </View>

                  {/* Item Description Input */}
                  <TextInput
                    style={styles.itemTitleInput}
                    placeholder="Task or replacement part name"
                    placeholderTextColor={colors.textMuted}
                    value={item.title}
                    onChangeText={(val) => handleUpdateItem(item.id, 'title', val)}
                  />

                  {/* Price Row */}
                  <View style={styles.costInputRow}>
                    <View style={styles.rupeePrefix}>
                      <IndianRupee size={14} color={isDark ? '#2dd4bf' : '#0d9488'} />
                    </View>
                    <TextInput
                      style={styles.costInput}
                      placeholder="Cost in ₹"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={item.cost === 0 ? '' : item.cost.toString()}
                      onChangeText={(val) => {
                        const num = parseInt(val.replace(/[^0-9]/g, ''), 10) || 0;
                        handleUpdateItem(item.id, 'cost', num);
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Live Bill Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Original Base Service:</Text>
                <Text style={styles.summaryVal}>₹{baseAmount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Additional Tasks & Parts ({items.length}):</Text>
                <Text style={[styles.summaryVal, { color: '#10b981', fontWeight: '800' }]}>
                  +₹{extraSubtotal}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRowTotal}>
                <Text style={styles.totalLabel}>Total Revised Bill:</Text>
                <Text style={styles.totalVal}>₹{newGrandTotal}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={submitting}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, (extraSubtotal === 0 || submitting) && styles.submitBtnDisabled]}
              onPress={handleSendBill}
              disabled={submitting || extraSubtotal === 0}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Send size={15} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Send Bill to Customer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: Palette, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '92%',
      paddingBottom: Platform.OS === 'ios' ? 28 : 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    modalSub: {
      fontSize: 11.5,
      color: colors.textMuted,
      marginTop: 2,
    },
    closeBtn: {
      padding: 6,
    },
    scrollArea: {
      paddingHorizontal: 18,
      paddingTop: 14,
    },
    calloutBox: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fef3c7',
      borderRadius: 10,
      padding: 10,
      gap: 8,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#fde68a',
    },
    calloutText: {
      fontSize: 11.5,
      lineHeight: 16,
      color: isDark ? '#fde68a' : '#92400e',
      flex: 1,
    },
    section: {
      marginBottom: 16,
    },
    sectionLabel: {
      fontSize: 10.5,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    notesInput: {
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#f8fafc',
      borderRadius: 12,
      padding: 12,
      fontSize: 13,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1',
      textAlignVertical: 'top',
      minHeight: 70,
    },
    chipHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 6,
    },
    chipSectionLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: isDark ? '#2dd4bf' : '#0d9488',
      letterSpacing: 0.5,
    },
    tradeCategoryScroll: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    tradeTabPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      marginRight: 6,
    },
    tradeTabPillActive: {
      backgroundColor: '#059669',
      borderColor: '#059669',
    },
    tradeTabPillText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#94a3b8' : '#475569',
    },
    tradeTabPillTextActive: {
      color: '#ffffff',
    },
    chipScroll: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    suggestionChip: {
      backgroundColor: isDark ? 'rgba(45, 212, 191, 0.12)' : '#ecfdf5',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(45, 212, 191, 0.25)' : '#a7f3d0',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    chipText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    chipPrice: {
      fontSize: 11,
      fontWeight: '800',
      color: isDark ? '#2dd4bf' : '#047857',
    },
    itemHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    addInlineBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 2,
    },
    addInlineText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#10b981',
    },
    itemRowCard: {
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
      marginBottom: 10,
    },
    itemTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    itemIndex: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      marginRight: 6,
    },
    typePillRow: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#e2e8f0',
      borderRadius: 8,
      padding: 2,
      gap: 2,
    },
    typePill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    typePillActive: {
      backgroundColor: '#10b981',
    },
    typePillText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textMuted,
    },
    typePillTextActive: {
      color: '#ffffff',
      fontWeight: '800',
    },
    deleteBtn: {
      padding: 4,
    },
    itemTitleInput: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 12.5,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1',
      marginBottom: 8,
    },
    costInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1',
      paddingHorizontal: 8,
    },
    rupeePrefix: {
      marginRight: 4,
    },
    costInput: {
      flex: 1,
      paddingVertical: 7,
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    summaryCard: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4',
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#bbf7d0',
      marginBottom: 20,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    summaryVal: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1',
      marginVertical: 8,
    },
    summaryRowTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: 13.5,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    totalVal: {
      fontSize: 16,
      fontWeight: '900',
      color: '#10b981',
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 18,
      paddingTop: 10,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1',
    },
    cancelBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
    },
    submitBtn: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: '#10b981',
      shadowColor: '#10b981',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 3,
    },
    submitBtnDisabled: {
      backgroundColor: isDark ? '#334155' : '#94a3b8',
      shadowOpacity: 0,
      elevation: 0,
    },
    submitBtnText: {
      fontSize: 13.5,
      fontWeight: '800',
      color: '#ffffff',
    },
  });

export default SupplementalBillModal;
