import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { TemplateService } from '../../../services/template.service';
import { TemplateField } from '../../../core/models/template-field.model';
import { Template } from '../../../core/models/template.model';
import { PdfPageView } from '../../../core/models/pdf-page.model';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';
import { EditorCanvasComponent } from '../editor-canvas/editor-canvas.component';
import { FieldPropertiesPanelComponent } from '../field-properties-panel/field-properties-panel.component';
import { EditorToolbarComponent } from '../editor-toolbar/editor-toolbar.component';
import { HistoryStack } from '../../../utils/history-stack';

@Component({
  selector: 'app-editor-page',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    NgFor,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    PdfViewerComponent,
    EditorCanvasComponent,
    FieldPropertiesPanelComponent,
    EditorToolbarComponent
  ],
  templateUrl: './editor-page.component.html',
  styleUrl: './editor-page.component.scss'
})
export class EditorPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly templateService = inject(TemplateService);
  private readonly destroy$ = new Subject<void>();
  private readonly history = new HistoryStack<TemplateField[]>(50);

  template?: Template;
  pages: PdfPageView[] = [];
  fields: TemplateField[] = [];
  selectedField: TemplateField | null = null;
  zoomLevels = [0.25, 0.5, 1, 1.5, 2];
  zoom = 1;
  readonly pdfSrc = '/assets/mock/sample.pdf';

  get canvasHeight(): number {
    if (!this.pages.length) return 1200;
    return (
      this.pages.reduce((acc, page) => acc + page.height, 0) +
      (this.pages.length - 1) * 24
    ) * this.zoom;
  }

  get canvasWidth(): number {
    return (this.pages[0]?.width ?? 800) * this.zoom;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.templateService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((template) => {
        if (template) {
          this.template = template;
          this.fields = structuredClone(template.fields);
          this.history.push(this.fields);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.control.s', ['$event'])
  onSaveShortcut(event: KeyboardEvent): void {
    event.preventDefault();
    this.save();
  }

  onPageRendered(page: PdfPageView): void {
    const nextPages = [...this.pages.filter((p) => p.num !== page.num), page].sort(
      (a, b) => a.num - b.num
    );
    let offset = 0;
    this.pages = nextPages.map((p) => {
      const withOffset = { ...p, offset } as PdfPageView & { offset: number };
      offset += p.height + 24;
      return withOffset;
    });
  }

  addTextField(): void {
    if (!this.template) return;
    const newField: TemplateField = {
      id: crypto.randomUUID(),
      x: 100,
      y: 100,
      width: 180,
      height: 40,
      page: 1,
      mapField: 'Campo nuevo',
      fontSize: 14,
      color: '#111827',
      type: 'text',
      fontFamily: 'standard:roboto',
      opacity: 1,
      backgroundColor: '#e0f2fe',
      locked: false,
      hidden: false,
      value: 'Ejemplo',
      multiline: false
    };
    this.fields = [...this.fields, newField];
    this.selectedField = newField;
    this.history.push(this.fields);
  }

  addImageField(): void {
    if (!this.template) return;
    const newField: TemplateField = {
      id: crypto.randomUUID(),
      x: 120,
      y: 120,
      width: 120,
      height: 80,
      page: 1,
      mapField: 'Imagen',
      fontSize: 12,
      color: '#111827',
      type: 'image',
      fontFamily: 'standard:roboto',
      opacity: 1,
      backgroundColor: '#fef3c7',
      locked: false,
      hidden: false,
      value: null,
      multiline: false
    };
    this.fields = [...this.fields, newField];
    this.selectedField = newField;
    this.history.push(this.fields);
  }

  onFieldSelected(field: TemplateField): void {
    this.selectedField = field;
  }

  onFieldUpdated(field: TemplateField): void {
    this.fields = this.fields.map((f) => (f.id === field.id ? field : f));
    this.selectedField = field;
    this.history.push(this.fields);
  }

  updateFieldFromPanel(field: TemplateField): void {
    this.onFieldUpdated(field);
  }

  undo(): void {
    const previous = this.history.undo(this.fields);
    if (previous) {
      this.fields = previous;
    }
  }

  redo(): void {
    const next = this.history.redo(this.fields);
    if (next) {
      this.fields = next;
    }
  }

  save(): void {
    if (!this.template) return;
    const payload = {
      pages: this.pages.map((page) => ({
        num: page.num,
        fields: this.fields
          .filter((f) => f.page === page.num)
          .map((f) => ({
            x: Math.round(f.x),
            y: Math.round(f.y),
            mapField: f.mapField,
            fontSize: f.fontSize,
            color: f.color,
            type: f.type,
            fontFamily: f.fontFamily,
            opacity: f.opacity,
            backgroundColor: f.backgroundColor,
            locked: f.locked,
            hidden: f.hidden,
            value: f.value
          }))
      }))
    };

    this.templateService.update(this.template.id, { fields: this.fields }).subscribe();
    console.log('Payload listo para enviar', payload);
  }

  onZoomChange(level: number): void {
    this.zoom = level;
  }
}
