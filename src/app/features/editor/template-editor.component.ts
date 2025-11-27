import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { Template, TemplateField, TemplatePage } from '../../core/models/template.model';
import { TemplateService } from '../../services/template.service';
import { EditorCanvasComponent, CanvasDimensions } from './editor-canvas.component';
import { PdfViewerComponent } from './pdf-viewer.component';
import { FieldPropertiesPanelComponent } from './field-properties-panel.component';
import { EditorToolbarComponent } from './editor-toolbar.component';
import { UndoRedoStack } from '../../utils/undo-redo';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    MatCardModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressBarModule,
    EditorCanvasComponent,
    PdfViewerComponent,
    FieldPropertiesPanelComponent,
    EditorToolbarComponent
  ],
  template: `
    <ng-container *ngIf="template(); else loading">
      <div class="flex flex-col gap-3">
        <mat-toolbar color="primary" class="rounded-xl shadow">
          <span class="font-semibold">Editor de Plantilla · {{ template()?.name }}</span>
          <span class="flex-1"></span>
          <mat-icon class="mr-2">light_mode</mat-icon>
        </mat-toolbar>

        <app-editor-toolbar
          [zoom]="zoom()"
          (save)="saveTemplate()"
          (addField)="addField($event)"
          (undo)="undo()"
          (redo)="redo()"
          (zoomChange)="setZoom($event)"
        />

        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 lg:col-span-8 space-y-4">
            <div *ngFor="let page of pages()" class="relative bg-surface p-3 rounded-xl shadow-sm border">
              <app-pdf-viewer
                [src]="template()?.pdfUrl"
                [page]="page.num"
                [zoom]="zoom()"
                (rendered)="setDimensions($event)"
              ></app-pdf-viewer>

              <div class="absolute inset-3 pointer-events-none" [style.width.px]="dimensions.get(page.num)?.width * zoom()" [style.height.px]="dimensions.get(page.num)?.height * zoom()">
                <app-editor-canvas
                  *ngIf="dimensions.get(page.num) as dims"
                  class="pointer-events-auto"
                  [page]="page"
                  [dimensions]="dims"
                  [zoom]="zoom()"
                  [selectedFieldId]="selectedFieldId()"
                  (selectField)="selectField($event)"
                  (updateField)="updateField(page.num, $event)"
                ></app-editor-canvas>
              </div>
            </div>
          </div>

          <div class="col-span-12 lg:col-span-4">
            <mat-card appearance="outlined" class="sticky top-4 max-h-[80vh] overflow-y-auto">
              <mat-card-header>
                <mat-card-title>Inspector</mat-card-title>
                <mat-card-subtitle>Propiedades del campo seleccionado</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <app-field-properties-panel
                  [field]="selectedField()"
                  (change)="updateField(currentPage(), $event)"
                  (delete)="removeField($event)"
                ></app-field-properties-panel>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </div>
    </ng-container>

    <ng-template #loading>
      <div class="flex flex-col items-center justify-center py-16 text-surface-variant gap-3">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        Cargando plantilla...
      </div>
    </ng-template>
  `
})
export class TemplateEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly templateService = inject(TemplateService);

  private undoRedo = new UndoRedoStack<TemplatePage[]>(50);
  readonly zoom: WritableSignal<number> = signal(1);
  readonly template: WritableSignal<Template | undefined> = signal(undefined);
  readonly pages: WritableSignal<TemplatePage[]> = signal([]);
  readonly selectedFieldId: WritableSignal<string | undefined> = signal(undefined);
  readonly dimensions = new Map<number, CanvasDimensions>();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.templateService.getById(id).subscribe((template) => {
      if (!template) return;
      this.template.set(template);
      this.pages.set(structuredClone(template.pages));
      this.undoRedo.push(template.pages);
    });
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.saveTemplate();
    }
  }

  setDimensions(event: { width: number; height: number; page: number }) {
    this.dimensions.set(event.page, { width: event.width, height: event.height });
  }

  selectField(id: string) {
    this.selectedFieldId.set(id);
  }

  currentPage() {
    return this.pages()[0]?.num ?? 1;
  }

  selectedField(): TemplateField | undefined {
    const id = this.selectedFieldId();
    return this.pages()
      .flatMap((p) => p.fields)
      .find((f) => f.id === id);
  }

  addField(type: TemplateField['type']) {
    const pages = structuredClone(this.pages());
    const field: TemplateField = {
      id: uuid(),
      x: 120,
      y: 120,
      width: 180,
      height: type === 'image' ? 120 : 48,
      mapField: 'Nuevo campo',
      fontSize: 16,
      color: '#111827',
      type,
      fontFamily: 'standard:roboto',
      opacity: 1,
      backgroundColor: '#e0f2fe',
      locked: false,
      hidden: false,
      value: type === 'text' ? 'Ejemplo' : null,
      multiline: false
    };
    pages[0].fields.push(field);
    this.pushState(pages);
    this.selectedFieldId.set(field.id);
  }

  updateField(pageNum: number, field: TemplateField) {
    const pages = structuredClone(this.pages());
    const page = pages.find((p) => p.num === pageNum);
    if (!page) return;
    page.fields = page.fields.map((f) => (f.id === field.id ? field : f));
    this.pushState(pages);
  }

  removeField(id: string) {
    const pages = structuredClone(this.pages());
    pages.forEach((p) => (p.fields = p.fields.filter((f) => f.id !== id)));
    this.pushState(pages);
    this.selectedFieldId.set(undefined);
  }

  saveTemplate() {
    const template = this.template();
    if (!template) return;
    const payload = this.templateService.toBackendPayload(this.pages());
    this.templateService.update(template.id, { pages: this.pages() }).subscribe(() => {
      console.info('Payload listo para backend', payload);
    });
  }

  undo() {
    const prev = this.undoRedo.undo(this.pages());
    if (prev) this.pages.set(prev);
  }

  redo() {
    const next = this.undoRedo.redo(this.pages());
    if (next) this.pages.set(next);
  }

  setZoom(zoom: number) {
    this.zoom.set(zoom);
  }

  private pushState(pages: TemplatePage[]) {
    this.pages.set(pages);
    this.undoRedo.push(pages);
  }
}
