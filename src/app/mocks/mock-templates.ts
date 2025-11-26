import { PdfTemplate } from '../shared/models/template.model';

export const MOCK_TEMPLATES: PdfTemplate[] = [
  {
    id: '1',
    name: 'Factura Demo',
    description: 'Plantilla de factura con campos de texto y logo.',
    pdfUrl: '/mock-sample.pdf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: [
      {
        num: 1,
        fields: [
          {
            id: 'f1',
            type: 'text',
            mapField: 'Cliente',
            x: 120,
            y: 160,
            width: 200,
            height: 40,
            fontSize: 16,
            color: '#0f172a',
            fontFamily: 'standard:roboto',
            opacity: 1,
            backgroundColor: '#ffffff',
            locked: false,
            hidden: false,
            value: null,
            multiline: false
          },
          {
            id: 'f2',
            type: 'text',
            mapField: 'Total',
            x: 120,
            y: 240,
            width: 180,
            height: 32,
            fontSize: 18,
            color: '#0f766e',
            fontFamily: 'standard:roboto',
            opacity: 1,
            backgroundColor: '#e0f2fe',
            locked: false,
            hidden: false,
            value: null,
            multiline: false
          }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Contrato',
    description: 'Plantilla con múltiples líneas y campos de firma.',
    pdfUrl: '/mock-sample.pdf',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: [
      {
        num: 1,
        fields: [
          {
            id: 'f3',
            type: 'text',
            mapField: 'Nombre',
            x: 90,
            y: 180,
            width: 240,
            height: 40,
            fontSize: 14,
            color: '#1f2937',
            fontFamily: 'standard:roboto',
            opacity: 1,
            backgroundColor: '#f8fafc',
            locked: false,
            hidden: false,
            value: null,
            multiline: true
          }
        ]
      }
    ]
  }
];
