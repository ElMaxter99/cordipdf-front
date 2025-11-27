import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { Template, TemplateField, TemplatePage, TemplatePayload } from '../core/models/template.model';

const PLACEHOLDER_PDF =
  'data:application/pdf;base64,JVBERi0xLjUKJeLjz9MNCjEgMCBvYmoNCjw8L1BhZ2VzIDIgMCBSDQo+Pg0KZW5kb2JqDQoyIDAgb2JqDQo8PC9UeXBlIC9QYWdlcy9Db3VudCAxL0tpZHMgWyAzIDAgUiBdDQo+Pg0KZW5kb2JqDQozIDAgb2JqDQo8PC9UeXBlIC9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdL0NvbnRlbnRzIDQgMCBSDQo+Pg0KZW5kb2JqDQp4cmVmDQowIDUNCjAwMDAwMDAwMDAgNjU1MzUgZiANCjAwMDAwMDAxMTIgMDAwMDAgbiANCjAwMDAwMDAyMTIgMDAwMDAgbiANCjAwMDAwMDAzMTIgMDAwMDAgbiANCjAwMDAwMDA0MTIgMDAwMDAgbiANCnRyYWlsZXINCjw8L1Jvb3QgMSAwIFIvU2l6ZSA1Pj4NCnN0YXJ0eHJlZg0KNDE2DQolJUVPRg==';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly templates = signal<Template[]>(this.createMockTemplates());

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Template[]> {
    return of(this.templates());
  }

  getById(id: string): Observable<Template | undefined> {
    return of(this.templates().find((t) => t.id === id));
  }

  create(payload: TemplatePayload): Observable<Template> {
    const now = new Date();
    const template: Template = { ...payload, id: uuid(), createdAt: now, updatedAt: now };
    this.templates.update((list) => [...list, template]);
    return of(template);
  }

  update(id: string, payload: Partial<TemplatePayload>): Observable<Template | undefined> {
    let updated: Template | undefined;
    this.templates.update((list) =>
      list.map((item) => {
        if (item.id === id) {
          updated = { ...item, ...payload, updatedAt: new Date() } as Template;
          return updated;
        }
        return item;
      })
    );
    return of(updated);
  }

  delete(id: string): Observable<boolean> {
    this.templates.update((list) => list.filter((item) => item.id !== id));
    return of(true);
  }

  uploadPdf(file: File): Observable<string> {
    return new Observable<string>((subscriber) => {
      const reader = new FileReader();
      reader.onload = () => {
        subscriber.next(reader.result as string);
        subscriber.complete();
      };
      reader.onerror = (err) => subscriber.error(err);
      reader.readAsDataURL(file);
    });
  }

  private createMockTemplates(): Template[] {
    const now = new Date();
    const page: TemplatePage = {
      num: 1,
      fields: [
        {
          id: uuid(),
          x: 140,
          y: 180,
          width: 180,
          height: 40,
          mapField: 'Ejemplo',
          fontSize: 18,
          color: '#ff0000',
          type: 'text',
          fontFamily: 'standard:roboto',
          opacity: 1,
          backgroundColor: '#1eff00',
          locked: false,
          hidden: false,
          value: 'Texto de ejemplo',
          multiline: true
        }
      ]
    };

    return [
      {
        id: uuid(),
        name: 'Contrato Laboral',
        description: 'Plantilla base para contratos laborales.',
        pdfUrl: PLACEHOLDER_PDF,
        pages: [structuredClone(page)],
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuid(),
        name: 'Orden de compra',
        description: 'Versión editable para órdenes de compra con campos básicos.',
        pdfUrl: PLACEHOLDER_PDF,
        pages: [structuredClone(page)],
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  toBackendPayload(pages: TemplatePage[]) {
    return {
      pages: pages.map((page) => ({
        num: page.num,
        fields: page.fields.map((field) => ({
          x: Math.round(field.x),
          y: Math.round(field.y),
          mapField: field.mapField,
          fontSize: field.fontSize,
          color: field.color,
          type: field.type,
          fontFamily: field.fontFamily,
          opacity: field.opacity,
          backgroundColor: field.backgroundColor,
          locked: field.locked,
          hidden: field.hidden,
          value: field.value
        }))
      }))
    } satisfies { pages: { num: number; fields: Partial<TemplateField>[] }[] };
  }
}
