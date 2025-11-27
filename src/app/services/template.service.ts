import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Template } from '../core/models/template.model';
import { templateMocks } from './mock-data';
import { TemplateField } from '../core/models/template-field.model';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly templatesState = signal<Template[]>(templateMocks);
  readonly templates = computed(() => this.templatesState());

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Template[]> {
    return of(this.templatesState());
  }

  getById(id: string): Observable<Template | undefined> {
    return of(this.templatesState().find((t) => t.id === id));
  }

  create(payload: Partial<Template>): Observable<Template> {
    const newTemplate: Template = {
      id: crypto.randomUUID(),
      name: payload.name ?? 'Nueva plantilla',
      description: payload.description ?? '',
      pdfUrl: payload.pdfUrl ?? '/assets/mock/sample.pdf',
      updatedAt: new Date().toISOString(),
      pages: payload.pages ?? 1,
      fields: payload.fields ?? []
    };
    this.templatesState.update((current) => [...current, newTemplate]);
    return of(newTemplate);
  }

  update(id: string, changes: Partial<Template>): Observable<Template | undefined> {
    let updated: Template | undefined;
    this.templatesState.update((current) =>
      current.map((t) => {
        if (t.id === id) {
          updated = { ...t, ...changes, updatedAt: new Date().toISOString() };
          return updated!;
        }
        return t;
      })
    );
    return of(updated);
  }

  delete(id: string): Observable<void> {
    this.templatesState.update((current) => current.filter((t) => t.id !== id));
    return of(void 0);
  }

  uploadPdf(file: File): Observable<string> {
    // Mock upload: in a real scenario we would POST the file and get a URL.
    const blobUrl = URL.createObjectURL(file);
    return of(blobUrl);
  }

  upsertField(templateId: string, field: TemplateField): Observable<Template | undefined> {
    return this.update(templateId, {
      fields: this.templatesState().find((t) => t.id === templateId)?.fields.map((f) =>
        f.id === field.id ? field : f
      )
    });
  }
}
