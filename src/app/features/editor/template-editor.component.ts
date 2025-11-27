import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EditorToolbarComponent } from './editor-toolbar/editor-toolbar.component';
import { PdfViewerComponent, PdfPageDimensions } from '../../shared/components/pdf-viewer/pdf-viewer.component';
import { EditorCanvasComponent } from './editor-canvas/editor-canvas.component';
import { FieldPropertiesPanelComponent } from './field-properties-panel/field-properties-panel.component';
import { Template, TemplateField, TemplatePage } from '../../shared/models/template.model';
import { TemplateService } from '../../services/template.service';
import { UndoRedoService } from '../../utils/undo-redo.service';
import { KeyboardShortcutsService } from '../../utils/keyboard-shortcuts.service';

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    EditorToolbarComponent,
    PdfViewerComponent,
    EditorCanvasComponent,
    FieldPropertiesPanelComponent
  ],
  template: `
    <div class="editor-shell" *ngIf="template(); else loading">
      <app-editor-toolbar
        [zoom]="zoom()"
        (zoomChange)="setZoom($event)"
        (save)="saveTemplate()"
        (undo)="undo()"
        (redo)="redo()"
        (addText)="addField('text')"
        (addImage)="addField('image')"
        (preview)="showPreview()"
      ></app-editor-toolbar>

      <div class="body">
        <div class="left-panel">
          <mat-form-field appearance="outline" class="page-select">
            <mat-select [value]="selectedPage()" (valueChange)="selectPage($event)">
              <mat-option *ngFor="let p of pages()" [value]="p.num">Página {{ p.num }}</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="pdf-wrapper">
            <div
              class="pdf-stage"
              [style.width.px]="pageDimensions()?.width || 0"
              [style.height.px]="pageDimensions()?.height || 0"
            >
              <app-pdf-viewer
                [src]="template()?.pdfUrl || null"
                [zoom]="zoom()"
                [page]="selectedPage()"
                (dimensions)="onPdfDimensions($event)"
              ></app-pdf-viewer>
              <app-editor-canvas
                *ngIf="pageDimensions() as dims"
                [fields]="currentFields()"
                [width]="dims.width"
                [height]="dims.height"
                [zoom]="zoom()"
                [selectedFieldId]="selectedFieldId()"
                (fieldSelected)="onFieldSelected($event)"
                (fieldUpdated)="onFieldUpdated($event)"
              ></app-editor-canvas>
            </div>
          </div>
        </div>
        <div class="right-panel">
          <app-field-properties-panel [field]="selectedField()" (updated)="onFieldUpdated($event)"></app-field-properties-panel>
        </div>
      </div>
    </div>
    <ng-template #loading>
      <div class="loading">
        <mat-spinner diameter="48"></mat-spinner>
        Cargando plantilla...
      </div>
    </ng-template>
  `,
  styles: [
    `
      .editor-shell {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .body {
        display: grid;
        grid-template-columns: 3fr 1fr;
        gap: 1rem;
        align-items: start;
      }
      .pdf-wrapper {
        position: relative;
        width: 100%;
        display: flex;
        justify-content: center;
      }
      .pdf-stage {
        position: relative;
      }
      .page-select {
        width: 220px;
      }
      .right-panel {
        position: sticky;
        top: 1rem;
      }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 2rem;
      }
    `
  ]
})
export class TemplateEditorComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly templateService = inject(TemplateService);
  private readonly undoRedo = inject(UndoRedoService<TemplatePage[]>);
  private readonly shortcuts = inject(KeyboardShortcutsService);
  private readonly snack = inject(MatSnackBar);

  protected readonly zoom = signal(1);
  protected readonly template = signal<Template | null>(null);
  protected readonly pages = signal<TemplatePage[]>([]);
  protected readonly selectedPage = signal(1);
  protected readonly selectedFieldId = signal<string | null>(null);
  protected readonly pageDimensions = signal<PdfPageDimensions | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.templateService.getById(id).subscribe((tpl) => {
        this.template.set(tpl);
        this.pages.set(JSON.parse(JSON.stringify(tpl.pages)));
        this.selectedPage.set(tpl.pages[0]?.num ?? 1);
        this.undoRedo.push(this.pages());
      });
    }
    this.shortcuts.registerSaveShortcut(() => this.saveTemplate());
  }

  ngOnDestroy(): void {
    this.shortcuts.cleanup();
  }

  setZoom(level: number): void {
    this.zoom.set(level);
  }

  onPdfDimensions(dimensions: PdfPageDimensions[]): void {
    const page = dimensions.find((d) => d.num === this.selectedPage());
    if (page) {
      this.pageDimensions.set(page);
    }
  }

  currentFields = computed(() => {
    const page = this.pages().find((p) => p.num === this.selectedPage());
    return page ? page.fields : [];
  });

  selectedField = computed(() => this.currentFields().find((f) => f.id === this.selectedFieldId()) ?? null);

  selectPage(pageNum: number): void {
    this.selectedPage.set(pageNum);
    const dims = this.pageDimensions();
    if (!dims || dims.num !== pageNum) {
      this.pageDimensions.set(null);
    }
    this.selectedFieldId.set(null);
  }

  addField(type: 'text' | 'image'): void {
    const field: TemplateField = {
      id: crypto.randomUUID(),
      x: 120,
      y: 120,
      width: 200,
      height: 32,
      mapField: type === 'text' ? 'Nuevo texto' : 'Imagen',
      fontSize: 14,
      color: '#1a1a1a',
      type,
      fontFamily: 'standard:roboto',
      opacity: 1,
      backgroundColor: '#ffffff',
      locked: false,
      hidden: false,
      value: null
    };
    this.recordState();
    this.updatePageFields((fields) => [...fields, field]);
    this.selectedFieldId.set(field.id);
  }

  onFieldSelected(id: string): void {
    this.selectedFieldId.set(id);
  }

  onFieldUpdated(field: TemplateField): void {
    this.recordState();
    this.updatePageFields((fields) => fields.map((f) => (f.id === field.id ? field : f)));
  }

  saveTemplate(): void {
    const tpl = this.template();
    if (!tpl) return;
    this.templateService.updatePageFields(tpl.id, this.pages()).subscribe(() => {
      this.snack.open('Plantilla guardada', 'Cerrar', { duration: 1500 });
    });
  }

  undo(): void {
    const state = this.undoRedo.undo(this.pages());
    if (state) {
      this.pages.set(state);
    }
  }

  redo(): void {
    const state = this.undoRedo.redo(this.pages());
    if (state) {
      this.pages.set(state);
    }
  }

  showPreview(): void {
    const payload = { pages: this.pages() };
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    this.snack.open('JSON copiado al portapapeles', 'Cerrar', { duration: 2000 });
  }

  private updatePageFields(updateFn: (fields: TemplateField[]) => TemplateField[]): void {
    this.pages.update((pages) =>
      pages.map((page) =>
        page.num === this.selectedPage() ? { ...page, fields: updateFn(page.fields) } : page
      )
    );
  }

  private recordState(): void {
    this.undoRedo.push(JSON.parse(JSON.stringify(this.pages())));
  }
}
