import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { TemplateModel, TemplatePage } from '../shared/models/template.model';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly templates$ = new BehaviorSubject<TemplateModel[]>(this.buildMockTemplates());

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<TemplateModel[]> {
    return this.templates$.asObservable();
  }

  getById(id: string): Observable<TemplateModel | undefined> {
    return this.templates$.pipe(map((list) => list.find((item) => item.id === id)));
  }

  create(payload: Partial<TemplateModel>): Observable<TemplateModel> {
    const next: TemplateModel = {
      id: crypto.randomUUID(),
      name: payload.name ?? 'Nueva plantilla',
      description: payload.description ?? '',
      pdfUrl: payload.pdfUrl ?? '/assets/mock.pdf',
      pages: payload.pages ?? [this.emptyPage(1)],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.templates$.next([next, ...this.templates$.value]);
    return of(next).pipe(delay(300));
  }

  update(id: string, payload: Partial<TemplateModel>): Observable<TemplateModel | undefined> {
    const updatedList = this.templates$.value.map((template) =>
      template.id === id
        ? {
            ...template,
            ...payload,
            updatedAt: new Date().toISOString()
          }
        : template
    );
    this.templates$.next(updatedList);
    const updated = updatedList.find((item) => item.id === id);
    return of(updated).pipe(delay(200));
  }

  delete(id: string): Observable<boolean> {
    const updatedList = this.templates$.value.filter((template) => template.id !== id);
    this.templates$.next(updatedList);
    return of(true).pipe(delay(150));
  }

  uploadPdf(file: File): Observable<string> {
    // Mocked upload. In a real scenario we would post the formData and receive the URL.
    const url = URL.createObjectURL(file);
    return of(url).pipe(delay(250));
  }

  private buildMockTemplates(): TemplateModel[] {
    const exampleField = {
      id: crypto.randomUUID(),
      x: 140,
      y: 680,
      mapField: 'Ejemplo',
      fontSize: 14,
      color: '#ff0000',
      type: 'text' as const,
      fontFamily: 'standard:roboto',
      opacity: 1,
      backgroundColor: '#1eff00',
      locked: false,
      hidden: false,
      value: null
    };

    return [
      {
        id: 'template-1',
        name: 'Contrato base',
        description: 'Plantilla de contrato con campos de cliente y fechas.',
        pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
        pages: [
          {
            num: 1,
            fields: [exampleField]
          },
          {
            num: 2,
            fields: []
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'template-2',
        name: 'Factura simple',
        description: 'Demostración de campos con multilínea y color de fondo.',
        pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
        pages: [
          {
            num: 1,
            fields: [
              {
                ...exampleField,
                id: crypto.randomUUID(),
                x: 120,
                y: 580,
                mapField: 'Cliente',
                backgroundColor: '#ffffff',
                fontSize: 16,
                multiline: true
              }
            ]
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private emptyPage(num: number): TemplatePage {
    return { num, fields: [] };
  }
}
