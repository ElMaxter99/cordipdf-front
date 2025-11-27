import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TemplateService } from '../../services/template.service';
import { TemplateField, TemplateModel, TemplatePage } from '../../shared/models/template.model';
import { EditorToolbarComponent } from '../../components/editor-toolbar/editor-toolbar.component';
import { PdfViewerComponent, PdfPageInfo } from '../../components/pdf-viewer/pdf-viewer.component';
import { EditorCanvasComponent } from '../../components/editor-canvas/editor-canvas.component';
import { FieldPropertiesPanelComponent } from '../../components/field-properties-panel/field-properties-panel.component';
import { ThemeService } from '../../core/theme/theme.service';
import { UndoRedoStack } from '../../utils/undo-redo';

@Component({
  selector: 'app-editor-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSidenavModule, MatListModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule, EditorToolbarComponent, PdfViewerComponent, EditorCanvasComponent, FieldPropertiesPanelComponent],
  template: `
    <div class="h-full flex flex-col">
      <app-editor-toolbar
        [title]="template()?.name || 'Editor PDF'"
        [zoom]="zoom()"
        [canUndo]="canUndo()"
        [canRedo]="canRedo()"
        (save)="saveTemplate()"
        (undo)="undo()"
        (redo)="redo()"
        (addField)="addField($event)"
        (zoomChange)="setZoom($event)"
        (toggleTheme)="theme.toggle()"
        (exit)="exit()"
      ></app-editor-toolbar>
      <mat-sidenav-container class="flex-1 min-h-[calc(100vh-64px)]">
        <mat-sidenav mode="side" opened class="w-80 border-r border-slate-100">
          <div class="p-4 space-y-2">
            <h3 class="font-semibold">Páginas</h3>
            <button
              *ngFor="let page of template()?.pages"
              mat-stroked-button
              color="primary"
              class="w-full justify-start"
              [class.bg-blue-50]="page.num === currentPage()?.num"
              (click)="selectPage(page.num)"
            >
              Página {{ page.num }} ({{ page.fields.length }} campos)
            </button>
          </div>
          <app-field-properties-panel
            [field]="selectedField()"
            (update)="updateField($event)"
          ></app-field-properties-panel>
        </mat-sidenav>

        <mat-sidenav-content>
          <div class="p-6 space-y-4">
            <mat-card>
              <mat-card-content>
                <div class="flex justify-between items-center mb-3">
                  <div>
                    <h3 class="font-semibold text-lg">{{ currentPageTitle() }}</h3>
                    <p class="text-sm text-slate-500">Zoom: {{ zoom() }}%</p>
                  </div>
                  <div class="flex gap-2 items-center">
                    <button mat-stroked-button (click)="addField('text')">
                      <mat-icon>text_fields</mat-icon>
                      Campo texto
                    </button>
                    <button mat-stroked-button (click)="addField('image')">
                      <mat-icon>image</mat-icon>
                      Campo imagen
                    </button>
                  </div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
                  <div class="space-y-4">
                    <div class="relative">
                      <app-pdf-viewer
                        [src]="template()?.pdfUrl || ''"
                        [scale]="zoom() / 100"
                        [page]="selectedPage()"
                        (pageRendered)="onPageRendered($event)"
                      ></app-pdf-viewer>
                      <div class="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
                        <app-editor-canvas
                          class="pointer-events-auto"
                          [fields]="currentPage()?.fields || []"
                          [pageWidth]="pageSize()?.width"
                          [pageHeight]="pageSize()?.height"
                          [zoom]="zoomFactor()"
                          (selectField)="setSelectedField($event)"
                          (changeField)="updateField($event)"
                        ></app-editor-canvas>
                      </div>
                    </div>
                  </div>
                  <div class="border rounded-lg bg-white shadow-sm p-4">
                    <h4 class="font-semibold mb-2">JSON generado</h4>
                    <pre class="text-xs bg-slate-900 text-slate-100 p-3 rounded overflow-auto max-h-[520px]">{{ exportJson() | json }}</pre>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `
})
export class EditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly templateService = inject(TemplateService);
  private readonly snackbar = inject(MatSnackBar);
  readonly theme = inject(ThemeService);

  readonly template = signal<TemplateModel | null>(null);
  readonly selectedField = signal<TemplateField | null>(null);
  readonly selectedPage = signal<number>(1);
  readonly zoom = signal<number>(100);
  readonly pageSize = signal<{ width: number; height: number }>({ width: 820, height: 1180 });
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);

  private readonly history = new UndoRedoStack<TemplateModel>((payload) =>
    JSON.parse(JSON.stringify(payload))
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.templateService.getById(id).subscribe((template) => {
      if (template) {
        this.template.set(template);
        this.selectedPage.set(template.pages[0]?.num ?? 1);
        this.history.push(template);
        this.updateHistoryFlags();
      }
    });
  }

  currentPage(): TemplatePage | undefined {
    return this.template()?.pages.find((page) => page.num === this.selectedPage());
  }

  currentPageTitle(): string {
    return `Página ${this.selectedPage()}`;
  }

  zoomFactor(): number {
    return this.zoom() / 100;
  }

  canUndo = computed(() => !!this.history);
  canRedo = computed(() => !!this.history);

  selectPage(num: number): void {
    this.selectedPage.set(num);
    this.selectedField.set(null);
  }

  setZoom(value: number): void {
    this.zoom.set(value);
  }

  setSelectedField(field: TemplateField): void {
    this.selectedField.set(field);
  }

  addField(type: 'text' | 'image'): void {
    const template = this.template();
    const page = this.currentPage();
    if (!template || !page) return;
    this.history.push(template);
    const newField: TemplateField = {
      id: crypto.randomUUID(),
      x: 50,
      y: 50,
      width: 200,
      height: type === 'image' ? 120 : 40,
      mapField: type === 'text' ? 'Nuevo campo' : 'Imagen',
      fontSize: 16,
      color: '#0f172a',
      type,
      fontFamily: 'standard:roboto',
      opacity: 1,
      backgroundColor: '#e2e8f0',
      locked: false,
      hidden: false,
      value: null,
      multiline: false
    };
    const updatedPages = template.pages.map((p) =>
      p.num === page.num ? { ...p, fields: [...p.fields, newField] } : p
    );
    const updatedTemplate = { ...template, pages: updatedPages };
    this.template.set(updatedTemplate);
    this.selectedField.set(newField);
    this.updateHistoryFlags();
  }

  updateField(field: TemplateField): void {
    const template = this.template();
    const page = this.currentPage();
    if (!template || !page) return;
    this.history.push(template);
    const updatedPages = template.pages.map((p) =>
      p.num === page.num
        ? { ...p, fields: p.fields.map((f) => (f.id === field.id ? field : f)) }
        : p
    );
    const updatedTemplate = { ...template, pages: updatedPages };
    this.template.set(updatedTemplate);
    this.selectedField.set(field);
    this.updateHistoryFlags();
  }

  onPageRendered(info: PdfPageInfo): void {
    const factor = this.zoomFactor();
    this.pageSize.set({ width: info.width / factor, height: info.height / factor });
  }

  exportJson() {
    const template = this.template();
    if (!template) return {};
    return {
      pages: template.pages.map((page) => ({
        num: page.num,
        fields: page.fields.map((f) => ({
          x: f.x,
          y: f.y,
          mapField: f.mapField,
          fontSize: f.fontSize,
          color: f.color,
          type: f.type,
          fontFamily: f.fontFamily,
          opacity: f.opacity,
          backgroundColor: f.backgroundColor,
          locked: f.locked,
          hidden: f.hidden,
          value: f.value ?? null
        }))
      }))
    };
  }

  saveTemplate(): void {
    const template = this.template();
    if (!template) return;
    this.templateService.update(template.id, { ...template }).subscribe(() => {
      this.snackbar.open('Plantilla guardada', 'Cerrar', { duration: 2000 });
    });
  }

  undo(): void {
    const template = this.template();
    if (!template) return;
    const prev = this.history.undo(template);
    if (prev) {
      this.template.set(prev);
      this.updateHistoryFlags();
    }
  }

  redo(): void {
    const template = this.template();
    if (!template) return;
    const next = this.history.redo(template);
    if (next) {
      this.template.set(next);
      this.updateHistoryFlags();
    }
  }

  private updateHistoryFlags(): void {
    this.canUndo.set(this.history.hasUndo());
    this.canRedo.set(this.history.hasRedo());
  }

  exit(): void {
    this.router.navigate(['/templates']);
  }

  @HostListener('document:keydown.control.s', ['$event'])
  handleCtrlS(event: KeyboardEvent): void {
    event.preventDefault();
    this.saveTemplate();
  }
}
