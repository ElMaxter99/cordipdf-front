import { Template } from '../shared/models/template.model';

export class MockTemplateBackend {
  static initialData(): Template[] {
    return [
      {
        id: 'tpl-100',
        name: 'Factura base',
        description: 'Plantilla de factura lista para empezar',
        pdfUrl: '/assets/sample.pdf',
        updatedAt: new Date().toISOString(),
        pages: [
          {
            num: 1,
            fields: [
              {
                id: 'fld-1',
                x: 140,
                y: 680,
                width: 180,
                height: 24,
                mapField: 'Cliente',
                fontSize: 14,
                color: '#ff0000',
                type: 'text',
                fontFamily: 'standard:roboto',
                opacity: 1,
                backgroundColor: '#1eff00',
                locked: false,
                hidden: false,
                value: 'ACME Corp'
              },
              {
                id: 'fld-2',
                x: 200,
                y: 620,
                width: 240,
                height: 24,
                mapField: 'Importe',
                fontSize: 16,
                color: '#222222',
                type: 'text',
                fontFamily: 'standard:montserrat',
                opacity: 0.8,
                backgroundColor: '#ffffff',
                locked: false,
                hidden: false,
                value: '$1,250.00'
              }
            ]
          },
          {
            num: 2,
            fields: [
              {
                id: 'fld-3',
                x: 100,
                y: 700,
                width: 160,
                height: 32,
                mapField: 'Notas',
                fontSize: 12,
                color: '#0d47a1',
                type: 'text',
                fontFamily: 'standard:inter',
                opacity: 1,
                backgroundColor: '#e3f2fd',
                locked: false,
                hidden: false,
                value: 'Gracias por su compra',
                multiline: true
              }
            ]
          }
        ]
      }
    ];
  }
}
