import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatTooltipModule,
    EditorToolbarComponent,
    PdfViewerComponent,
    EditorCanvasComponent,
    FieldPropertiesPanelComponent
  ],
  template: `
    <div class="workspace-shell" *ngIf="template() as tpl; else loading">
      <mat-toolbar color="primary" class="workspace-header">
        <div class="brand">
          <span class="logo">CordiPDF</span>
          <span class="version">v{{ version }}</span>
          <span class="template-name">{{ tpl.name }}</span>
        </div>
        <div class="header-actions">
          <div class="page-nav">
            <button
              mat-icon-button
              matTooltip="Página anterior"
              (click)="previousPage()"
              [disabled]="selectedPage() === 1"
            >
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span class="page-indicator">Página {{ selectedPage() }} / {{ totalPages() }}</span>
            <button
              mat-icon-button
              matTooltip="Página siguiente"
              (click)="nextPage()"
              [disabled]="selectedPage() === totalPages()"
            >
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
          <mat-form-field appearance="fill" class="zoom-field">
            <mat-label>Zoom</mat-label>
            <mat-select [value]="zoom()" (valueChange)="setZoom($event)">
              <mat-option *ngFor="let level of zoomLevels" [value]="level">{{ level * 100 }}%</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-icon-button matTooltip="Deshacer" (click)="undo()" [disabled]="!undoRedo.canUndo()">
            <mat-icon>undo</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Rehacer" (click)="redo()" [disabled]="!undoRedo.canRedo()">
            <mat-icon>redo</mat-icon>
          </button>
          <button
            mat-icon-button
            matTooltip="Borrar campos de la página"
            (click)="clearPage()"
            [disabled]="!currentFields().length"
          >
            <mat-icon>backspace</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Descargar PDF anotado" (click)="downloadAnnotatedJson()">
            <mat-icon>download</mat-icon>
          </button>
          <mat-select class="language" [value]="language()" (valueChange)="setLanguage($event)">
            <mat-option value="es">ES</mat-option>
            <mat-option value="en">EN</mat-option>
          </mat-select>
          <mat-button-toggle-group [value]="theme()" (valueChange)="setTheme($event.value)">
            <mat-button-toggle value="light">Claro</mat-button-toggle>
            <mat-button-toggle value="dark">Oscuro</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </mat-toolbar>

      <div class="workspace-grid">
        <aside class="sidebar">
          <header class="sidebar-header">
            <div>
              <p class="eyebrow">Plantilla</p>
              <h3>{{ tpl.name }}</h3>
              <p class="muted">{{ tpl.description }}</p>
            </div>
            <span class="status">{{ mode() === 'preview' ? 'Preview' : 'Edición' }}</span>
          </header>

          <section class="sidebar-card">
            <div class="card-head">
              <h4>Coordenadas JSON</h4>
              <mat-button-toggle-group
                [value]="jsonViewMode()"
                (valueChange)="setJsonViewMode($event.value)"
              >
                <mat-button-toggle value="text">Texto</mat-button-toggle>
                <mat-button-toggle value="tree">Árbol</mat-button-toggle>
              </mat-button-toggle-group>
            </div>
            <div class="json-view" *ngIf="jsonViewMode() === 'text'">
              <textarea readonly [value]="annotationJson()" rows="10"></textarea>
            </div>
            <div class="json-tree" *ngIf="jsonViewMode() === 'tree'">
              <div class="chip" *ngFor="let item of flatFields()">
                P{{ item.page }} · {{ item.type }} · {{ item.mapField }}
              </div>
              <p class="muted" *ngIf="!flatFields().length">No hay anotaciones aún</p>
            </div>
            <div class="json-actions">
              <button mat-stroked-button (click)="copyJson()">
                <mat-icon>content_copy</mat-icon>
                Copiar
              </button>
              <button mat-stroked-button (click)="downloadAnnotatedJson()">
                <mat-icon>file_download</mat-icon>
                Descargar
              </button>
            </div>
            <mat-form-field appearance="fill" class="import-field">
              <mat-label>Importar JSON</mat-label>
              <textarea matInput [(ngModel)]="importBuffer" rows="5" aria-label="JSON a importar"></textarea>
            </mat-form-field>
            <button mat-flat-button color="primary" (click)="importJson()">Aplicar JSON</button>
          </section>

          <section class="sidebar-card">
            <div class="card-head">
              <h4>Miniaturas</h4>
              <span class="muted">Navega entre páginas</span>
            </div>
            <div class="thumb" *ngFor="let p of pages()" [class.active]="p.num === selectedPage()" (click)="selectPage(p.num)">
              <div>
                <p class="title">Página {{ p.num }}</p>
                <p class="muted">{{ pageSizeLabel(p.num) }}</p>
              </div>
              <mat-icon>navigate_next</mat-icon>
            </div>
          </section>

          <section class="sidebar-card">
            <div class="card-head">
              <h4>Panel avanzado</h4>
              <span class="muted">Fuentes y guías</span>
            </div>
            <div class="toggles">
              <button mat-button (click)="toggleGuide('grid')" [color]="guides().grid ? 'primary' : undefined">
                <mat-icon>grid_on</mat-icon>
                Rejilla {{ guides().grid ? 'activa' : 'apagada' }}
              </button>
              <button mat-button (click)="toggleGuide('rulers')" [color]="guides().rulers ? 'primary' : undefined">
                <mat-icon>straighten</mat-icon>
                Reglas {{ guides().rulers ? 'activas' : 'apagadas' }}
              </button>
              <button mat-button (click)="toggleGuide('snap')" [color]="guides().snap ? 'primary' : undefined">
                <mat-icon>flare</mat-icon>
                Ajuste {{ guides().snap ? 'activado' : 'desactivado' }}
              </button>
            </div>
          </section>
        </aside>

        <main class="viewer-area">
          <div class="viewer-head">
            <app-editor-toolbar
              [zoom]="zoom()"
              (zoomChange)="setZoom($event)"
              (save)="saveTemplate()"
              (undo)="undo()"
              (redo)="redo()"
              (addText)="addField('text')"
              (addImage)="addField('image')"
              (preview)="togglePreview()"
            ></app-editor-toolbar>
            <div class="mode-toggle">
              <mat-button-toggle-group [value]="mode()" (valueChange)="setMode($event.value)">
                <mat-button-toggle value="edit">Editar</mat-button-toggle>
                <mat-button-toggle value="preview">Preview</mat-button-toggle>
              </mat-button-toggle-group>
              <button mat-stroked-button (click)="showPreview()">
                <mat-icon>description</mat-icon>
                Copiar JSON
              </button>
            </div>
          </div>

          <div class="canvas-row">
            <div class="stage-wrapper">
              <div class="page-selectors">
                <mat-form-field appearance="outline" class="page-select">
                  <mat-label>Página</mat-label>
                  <mat-select [value]="selectedPage()" (valueChange)="selectPage($event)">
                    <mat-option *ngFor="let p of pages()" [value]="p.num">Página {{ p.num }}</mat-option>
                  </mat-select>
                </mat-form-field>
                <button mat-button (click)="duplicatePage()" [disabled]="!pages().length">
                  <mat-icon>library_add</mat-icon>
                  Duplicar página
                </button>
              </div>

              <div class="pdf-wrapper" *ngIf="pageDimensions(); else emptyPage">
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
              <ng-template #emptyPage>
                <div class="empty">Carga un PDF para empezar a diseñar.</div>
              </ng-template>
            </div>

            <div class="properties">
              <app-field-properties-panel [field]="selectedField()" (updated)="onFieldUpdated($event)"></app-field-properties-panel>
            </div>
          </div>
        </main>
      </div>

      <footer class="workspace-footer">
        <div>
          <p class="muted">CordiPDF Editor · {{ currentYear }}</p>
          <p class="muted">Capas de edición, plantillas y exportación JSON conectadas como en /workspace.</p>
        </div>
        <div class="footer-links">
          <a href="https://example.com" target="_blank" rel="noreferrer">Aplicación</a>
          <a href="https://example.com/licencia" target="_blank" rel="noreferrer">Licencia</a>
        </div>
      </footer>
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
      :host {
        display: block;
      }
      .workspace-shell {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-height: 100vh;
      }
      .workspace-header {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
      }
      .logo {
        letter-spacing: 0.04em;
      }
      .version {
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.16);
        font-size: 0.85rem;
      }
      .template-name {
        font-weight: 500;
        padding-left: 0.5rem;
        border-left: 1px solid rgba(255, 255, 255, 0.2);
      }
      .header-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
        margin-left: auto;
      }
      .page-nav {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.15rem 0.35rem;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 999px;
      }
      .page-indicator {
        font-variant-numeric: tabular-nums;
      }
      .zoom-field {
        width: 120px;
        --mdc-filled-text-field-container-color: rgba(255, 255, 255, 0.16);
        --mdc-filled-text-field-input-text-color: #fff;
      }
      .language {
        width: 84px;
      }
      .workspace-grid {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 1rem;
      }
      .sidebar {
        background: var(--mat-sys-surface-container-high);
        border-radius: 1rem;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        border: 1px dashed transparent;
        transition: border-color 0.2s ease, background 0.2s ease;
      }
      .sidebar-header h3 {
        margin: 0;
      }
      .sidebar-header .muted {
        margin: 0.25rem 0 0;
      }
      .eyebrow {
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mat-sys-primary);
        margin: 0;
        font-size: 0.75rem;
      }
      .muted {
        color: var(--mat-sys-on-surface-variant);
        margin: 0;
      }
      .status {
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        background: var(--mat-sys-surface-container-highest);
        border: 1px solid var(--mat-sys-outline);
        font-size: 0.85rem;
        align-self: flex-start;
      }
      .sidebar-card {
        background: var(--mat-sys-surface-container-low);
        border-radius: 0.75rem;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }
      .card-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
      }
      .json-view textarea {
        width: 100%;
        font-family: 'JetBrains Mono', monospace;
        border-radius: 0.5rem;
        padding: 0.5rem;
      }
      .json-tree {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .chip {
        padding: 0.35rem 0.55rem;
        border-radius: 999px;
        background: var(--mat-sys-surface-container-highest);
        border: 1px solid var(--mat-sys-outline-variant);
        font-size: 0.85rem;
      }
      .json-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .import-field textarea {
        min-height: 120px;
        font-family: 'JetBrains Mono', monospace;
      }
      .thumb {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.1s ease;
      }
      .thumb:hover {
        background: var(--mat-sys-surface-container-highest);
        transform: translateY(-1px);
      }
      .thumb.active {
        border: 1px solid var(--mat-sys-primary);
      }
      .thumb .title {
        margin: 0;
        font-weight: 600;
      }
      .toggles {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .viewer-area {
        background: var(--mat-sys-surface-container-high);
        border-radius: 1rem;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .viewer-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .mode-toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      .canvas-row {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 1rem;
        align-items: start;
      }
      .stage-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .page-selectors {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .page-select {
        width: 220px;
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
      .empty {
        padding: 2rem;
        background: var(--mat-sys-surface-container);
        border-radius: 0.75rem;
        text-align: center;
      }
      .properties {
        position: sticky;
        top: 80px;
      }
      .workspace-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--mat-sys-surface-container);
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
      }
      .footer-links {
        display: flex;
        gap: 0.75rem;
      }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 2rem;
      }
      @media (max-width: 1200px) {
        .workspace-grid {
          grid-template-columns: 1fr;
        }
        .canvas-row {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class TemplateEditorComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly templateService = inject(TemplateService);
  private readonly snack = inject(MatSnackBar);
  private readonly shortcuts = inject(KeyboardShortcutsService);
  readonly undoRedo = inject<UndoRedoService<TemplatePage[]>>(UndoRedoService);

  protected readonly version = '1.0.0';
  protected readonly currentYear = new Date().getFullYear();
  protected readonly zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2];

  protected readonly zoom = signal(1);
  protected readonly language = signal<'es' | 'en'>('es');
  protected readonly theme = signal<'light' | 'dark'>('light');
  protected readonly mode = signal<'edit' | 'preview'>('edit');
  protected readonly jsonViewMode = signal<'text' | 'tree'>('text');
  protected readonly guides = signal({ grid: false, rulers: false, snap: true });

  protected importBuffer = '';

  protected readonly template = signal<Template | null>(null);
  protected readonly pages = signal<TemplatePage[]>([]);
  protected readonly selectedPage = signal(1);
  protected readonly selectedFieldId = signal<string | null>(null);
  protected readonly pageDimensions = signal<PdfPageDimensions | null>(null);
  protected readonly pdfDimensions = signal<PdfPageDimensions[]>([]);

  protected readonly annotationJson = computed(() => JSON.stringify({ pages: this.pages() }, null, 2));
  protected readonly flatFields = computed(() =>
    this.pages().flatMap((page) => page.fields.map((field) => ({ ...field, page: page.num })))
  );
  protected readonly totalPages = computed(() => Math.max(this.pages().length || 1, this.pdfDimensions().length || 1));

  protected readonly currentFields = computed(() => {
    const page = this.pages().find((p) => p.num === this.selectedPage());
    return page ? page.fields : [];
  });

  protected readonly selectedField = computed(
    () => this.currentFields().find((f) => f.id === this.selectedFieldId()) ?? null
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.templateService.getById(id).subscribe((tpl) => {
        this.template.set(tpl);
        this.pages.set(JSON.parse(JSON.stringify(tpl.pages)));
        this.selectedPage.set(tpl.pages[0]?.num ?? 1);
        this.undoRedo.clear();
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

  setLanguage(lang: 'es' | 'en'): void {
    this.language.set(lang);
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.theme.set(theme);
  }

  setMode(mode: 'edit' | 'preview'): void {
    this.mode.set(mode);
  }

  setJsonViewMode(mode: 'text' | 'tree'): void {
    this.jsonViewMode.set(mode);
  }

  togglePreview(): void {
    this.mode.set(this.mode() === 'preview' ? 'edit' : 'preview');
  }

  onPdfDimensions(dimensions: PdfPageDimensions[]): void {
    this.pdfDimensions.set(dimensions);
    const page = dimensions.find((d) => d.num === this.selectedPage());
    if (page) {
      this.pageDimensions.set(page);
    }
  }

  selectPage(pageNum: number): void {
    this.selectedPage.set(pageNum);
    const dims = this.pdfDimensions().find((d) => d.num === pageNum) ?? null;
    this.pageDimensions.set(dims);
    this.selectedFieldId.set(null);
  }

  previousPage(): void {
    if (this.selectedPage() > 1) {
      this.selectPage(this.selectedPage() - 1);
    }
  }

  nextPage(): void {
    if (this.selectedPage() < this.totalPages()) {
      this.selectPage(this.selectedPage() + 1);
    }
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

  clearPage(): void {
    this.recordState();
    this.updatePageFields(() => []);
    this.selectedFieldId.set(null);
  }

  downloadAnnotatedJson(): void {
    const blob = new Blob([this.annotationJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotated-page-${this.selectedPage()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  copyJson(): void {
    navigator.clipboard?.writeText(this.annotationJson());
    this.snack.open('JSON copiado al portapapeles', 'Cerrar', { duration: 1500 });
  }

  importJson(): void {
    if (!this.importBuffer.trim()) return;
    try {
      const parsed = JSON.parse(this.importBuffer);
      const pages = (parsed.pages ?? parsed) as TemplatePage[];
      if (!Array.isArray(pages)) {
        throw new Error('Formato inválido');
      }
      this.pages.set(JSON.parse(JSON.stringify(pages)));
      this.undoRedo.clear();
      this.undoRedo.push(this.pages());
      this.snack.open('Coordenadas aplicadas', 'Cerrar', { duration: 1500 });
    } catch (error) {
      this.snack.open('No se pudo importar el JSON', 'Cerrar', { duration: 2000 });
    }
  }

  showPreview(): void {
    const payload = { pages: this.pages() };
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    this.snack.open('JSON copiado al portapapeles', 'Cerrar', { duration: 2000 });
  }

  duplicatePage(): void {
    const current = this.pages().find((p) => p.num === this.selectedPage());
    if (!current) return;
    const clone: TemplatePage = {
      num: this.pages().length + 1,
      fields: current.fields.map((f) => ({ ...f, id: crypto.randomUUID() }))
    };
    this.recordState();
    this.pages.update((pages) => [...pages, clone]);
    this.selectPage(clone.num);
  }

  toggleGuide(key: 'grid' | 'rulers' | 'snap'): void {
    this.guides.update((current) => ({ ...current, [key]: !current[key] }));
  }

  pageSizeLabel(pageNum: number): string {
    const dims = this.pdfDimensions().find((d) => d.num === pageNum);
    return dims ? `${Math.round(dims.width)} × ${Math.round(dims.height)} px` : 'Sin medidas';
  }

  private updatePageFields(updateFn: (fields: TemplateField[]) => TemplateField[]): void {
    this.pages.update((pages) =>
      pages.map((page) => (page.num === this.selectedPage() ? { ...page, fields: updateFn(page.fields) } : page))
    );
  }

  private recordState(): void {
    this.undoRedo.push(JSON.parse(JSON.stringify(this.pages())));
  }
}
