import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, take } from 'rxjs/operators';
import { MOCK_TEMPLATES } from '../mocks/mock-templates';
import { PdfTemplate, SavePayload, TemplatePage } from '../shared/models/template.model';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly apiUrl = '/api/templates';
  private readonly templates$ = new BehaviorSubject<PdfTemplate[]>(structuredClone(MOCK_TEMPLATES));

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<PdfTemplate[]> {
    return this.templates$.asObservable().pipe(delay(150));
  }

  getById(id: string): Observable<PdfTemplate | undefined> {
    return this.templates$.pipe(map((templates) => templates.find((t) => t.id === id)));
  }

  create(payload: Partial<PdfTemplate>): Observable<PdfTemplate> {
    const newTemplate: PdfTemplate = {
      id: crypto.randomUUID(),
      name: payload.name ?? 'Nueva plantilla',
      description: payload.description ?? '',
      pdfUrl: payload.pdfUrl ?? '/mock-sample.pdf',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pages: payload.pages ?? [{ num: 1, fields: [] }]
    };

    return this.templates$.pipe(
      take(1),
      map((templates) => {
        this.templates$.next([...templates, newTemplate]);
        return newTemplate;
      })
    );
  }

  update(id: string, changes: Partial<PdfTemplate>): Observable<PdfTemplate | undefined> {
    return this.templates$.pipe(
      take(1),
      map((templates) => {
        const next = templates.map((tpl) =>
          tpl.id === id ? { ...tpl, ...changes, updatedAt: new Date().toISOString() } : tpl
        );
        this.templates$.next(next);
        return next.find((tpl) => tpl.id === id);
      })
    );
  }

  delete(id: string): Observable<boolean> {
    return this.templates$.pipe(
      take(1),
      map((templates) => {
        const filtered = templates.filter((tpl) => tpl.id !== id);
        this.templates$.next(filtered);
        return templates.length !== filtered.length;
      })
    );
  }

  uploadPdf(file: File): Observable<string> {
    const url = URL.createObjectURL(file);
    return of(url).pipe(delay(200));
  }

  saveLayout(templateId: string, pages: TemplatePage[]): Observable<SavePayload> {
    const payload: SavePayload = {
      pages: pages.map((page) => ({
        num: page.num,
        fields: page.fields.map((field) => ({
          x: field.x,
          y: field.y,
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
    };

    return this.update(templateId, { pages }).pipe(map(() => payload));
  }

  resetMock(): void {
    this.templates$.next(structuredClone(MOCK_TEMPLATES));
  }
}
