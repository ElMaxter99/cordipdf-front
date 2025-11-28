import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, delay, map, of, tap } from 'rxjs';
import { Template, TemplateField, TemplatePage } from '../shared/models/template.model';
import { MockTemplateBackend } from './templates.mock';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly apiUrl = '/api/templates';
  private readonly storageKey = 'cordipdf.templates';
  private readonly templates$ = new BehaviorSubject<Template[]>(this.loadTemplates());

  constructor(private readonly http: HttpClient) {}

  private loadTemplates(): Template[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          return JSON.parse(raw) as Template[];
        }
      } catch (error) {
        console.error('Error loading templates from storage', error);
      }
    }
    return MockTemplateBackend.initialData();
  }

  private persist(templates: Template[]): void {
    this.templates$.next(templates);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(templates));
      } catch (error) {
        console.error('Error persisting templates', error);
      }
    }
  }

  getAll(): Observable<Template[]> {
    return this.templates$.asObservable().pipe(delay(150));
  }

  getById(id: string): Observable<Template> {
    return this.templates$.pipe(
      map((templates) => {
        const found = templates.find((t) => t.id === id);
        if (!found) {
          throw new Error('Template not found');
        }
        return found;
      })
    );
  }

  create(template: Omit<Template, 'id' | 'updatedAt'>): Observable<Template> {
    const newTemplate: Template = {
      ...template,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString()
    };
    const templates = [...this.templates$.value, newTemplate];
    this.persist(templates);
    return of(newTemplate).pipe(delay(150));
  }

  update(id: string, changes: Partial<Template>): Observable<Template> {
    const updated = this.templates$.value.map((template) =>
      template.id === id ? { ...template, ...changes, updatedAt: new Date().toISOString() } : template
    );
    const current = updated.find((t) => t.id === id) as Template;
    this.persist(updated);
    return of(current).pipe(delay(150));
  }

  updatePageFields(id: string, pages: TemplatePage[]): Observable<Template> {
    return this.update(id, { pages });
  }

  delete(id: string): Observable<void> {
    this.persist(this.templates$.value.filter((template) => template.id !== id));
    return of(void 0).pipe(delay(150));
  }

  uploadPdf(file: File): Observable<{ url: string; name: string }> {
    const blobUrl = URL.createObjectURL(file);
    return of({ url: blobUrl, name: file.name }).pipe(delay(150));
  }

  addFieldToPage(templateId: string, pageNumber: number, field: TemplateField): Observable<Template> {
    return this.getById(templateId).pipe(
      tap((template) => {
        const pages = template.pages.map((page) =>
          page.num === pageNumber ? { ...page, fields: [...page.fields, field] } : page
        );
        this.update(templateId, { pages }).subscribe();
      })
    );
  }
}
