import { Template } from '../core/models/template.model';
import { TemplateField } from '../core/models/template-field.model';

const baseFields: TemplateField[] = [
  {
    id: 'field-1',
    x: 140,
    y: 680,
    width: 200,
    height: 40,
    page: 1,
    mapField: 'Ejemplo',
    fontSize: 14,
    color: '#ff0000',
    type: 'text',
    fontFamily: 'standard:roboto',
    opacity: 1,
    backgroundColor: '#1eff00',
    locked: false,
    hidden: false,
    value: 'Texto de ejemplo',
    multiline: false
  }
];

export const templateMocks: Template[] = [
  {
    id: '1',
    name: 'Contrato básico',
    description: 'Plantilla de contrato con campos de cliente',
    pdfUrl: '/assets/mock/sample.pdf',
    updatedAt: new Date().toISOString(),
    pages: 2,
    fields: baseFields
  },
  {
    id: '2',
    name: 'Factura',
    description: 'Factura estándar con logo y totales',
    pdfUrl: '/assets/mock/sample.pdf',
    updatedAt: new Date().toISOString(),
    pages: 1,
    fields: []
  }
];
