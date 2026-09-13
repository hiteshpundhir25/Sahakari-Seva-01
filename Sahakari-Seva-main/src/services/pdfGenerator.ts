// src/services/pdfGenerator.ts
// Platform dispatcher: On Web Metro uses pdfGenerator.web.ts (jsPDF).
// On Native Mobile (Android/iOS Hermes) Metro uses pdfGenerator.native.ts or this safe fallback.

export * from './pdfGenerator.native';
