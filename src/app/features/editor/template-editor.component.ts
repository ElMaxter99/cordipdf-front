import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { EditorToolbarComponent } from './editor-toolbar/editor-toolbar.component';
import { PdfPageDimensions } from '../../shared/components/pdf-viewer/pdf-viewer.component';
import { FieldPropertiesPanelComponent } from './field-properties-panel/field-properties-panel.component';
import { FONT_OPTIONS, Template, TemplateField, TemplatePage } from '../../shared/models/template.model';
import { TemplateService } from '../../services/template.service';
import { UndoRedoService } from '../../utils/undo-redo.service';
import { KeyboardShortcutsService } from '../../utils/keyboard-shortcuts.service';
import { GlobalWorkerOptions, PDFDocumentProxy, getDocument } from 'pdfjs-dist';

const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url);
GlobalWorkerOptions.workerSrc = workerSrc.toString();

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
    MatSlideToggleModule,
    EditorToolbarComponent,
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
          <mat-button-toggle-group [value]="theme()" (valueChange)="setTheme($event)">
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
                (valueChange)="setJsonViewMode($event)"
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
              <mat-button-toggle-group [value]="mode()" (valueChange)="setMode($event)">
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

              <div class="pdf-wrapper">
                <div
                  class="pdf-stage"
                  #pdfStage
                  [style.width.px]="pageDimensions()?.width || 820"
                  [style.height.px]="pageDimensions()?.height || 640"
                >
                  <canvas #pdfCanvas class="pdf-canvas"></canvas>
                  <canvas #overlayCanvas class="overlay-canvas"></canvas>
                  <div #annotationsLayer class="annotations-layer"></div>
                  <div class="editor-layer" *ngIf="pageDimensions()">
                    <div class="backdrop" *ngIf="previewField()" (click)="cancelPreview()"></div>
                    <div
                      #previewModal
                      class="floating-editor"
                      *ngIf="previewField() as field"
                      [ngStyle]="editorStyle(field)"
                      (click)="$event.stopPropagation()"
                    >
                      <header>
                        <h4>Nuevo campo</h4>
                        <button mat-icon-button (click)="cancelPreview()" aria-label="Cerrar">
                          <mat-icon>close</mat-icon>
                        </button>
                      </header>
                      <form class="editor-form">
                        <mat-form-field appearance="fill">
                          <mat-label>Tipo</mat-label>
                          <mat-select [(ngModel)]="field.type" name="previewType">
                            <mat-option value="text">Texto</mat-option>
                            <mat-option value="image">Imagen</mat-option>
                          </mat-select>
                        </mat-form-field>
                        <mat-form-field appearance="fill">
                          <mat-label>Texto</mat-label>
                          <input matInput [(ngModel)]="field.mapField" name="previewMapField" />
                        </mat-form-field>
                        <div class="inline">
                          <mat-form-field appearance="fill">
                            <mat-label>Tamaño</mat-label>
                            <input matInput type="number" [(ngModel)]="field.fontSize" name="previewFontSize" />
                          </mat-form-field>
                          <mat-form-field appearance="fill">
                            <mat-label>Opacidad</mat-label>
                            <input
                              matInput
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              [(ngModel)]="field.opacity"
                              name="previewOpacity"
                            />
                          </mat-form-field>
                        </div>
                        <div class="inline">
                          <mat-form-field appearance="fill">
                            <mat-label>Color</mat-label>
                            <input matInput type="color" [(ngModel)]="field.color" name="previewColor" />
                          </mat-form-field>
                          <mat-form-field appearance="fill">
                            <mat-label>Fondo</mat-label>
                            <input matInput type="color" [(ngModel)]="field.backgroundColor" name="previewBg" />
                          </mat-form-field>
                        </div>
                        <mat-form-field appearance="fill">
                          <mat-label>Fuente</mat-label>
                          <mat-select [(ngModel)]="field.fontFamily" name="previewFont">
                            <mat-option *ngFor="let font of fonts" [value]="font">{{ font }}</mat-option>
                          </mat-select>
                        </mat-form-field>
                        <mat-form-field appearance="fill">
                          <mat-label>Valor</mat-label>
                          <input matInput [(ngModel)]="field.value" name="previewValue" />
                        </mat-form-field>
                        <div class="toggle-row">
                          <mat-slide-toggle [(ngModel)]="field.locked" name="previewLocked">Bloquear</mat-slide-toggle>
                          <mat-slide-toggle [(ngModel)]="field.hidden" name="previewHidden">Ocultar</mat-slide-toggle>
                        </div>
                        <div class="actions">
                          <button mat-stroked-button color="primary" type="button" (click)="confirmPreview()">✅ Confirmar</button>
                          <button mat-button type="button" (click)="cancelPreview()">❌ Cancelar</button>
                        </div>
                      </form>
                    </div>

                    <div
                      #editModal
                      class="floating-editor"
                      *ngIf="editingField() as field"
                      [ngStyle]="editorStyle(field)"
                      (mousedown)="$event.stopPropagation()"
                    >
                      <header>
                        <h4>Editar campo</h4>
                        <div class="header-actions">
                          <button mat-icon-button (click)="deleteAnnotation(field.id)" aria-label="Eliminar">
                            <mat-icon>delete</mat-icon>
                          </button>
                          <button mat-icon-button (click)="cancelEdit()" aria-label="Cerrar">
                            <mat-icon>close</mat-icon>
                          </button>
                        </div>
                      </header>
                      <form class="editor-form">
                        <mat-form-field appearance="fill">
                          <mat-label>Tipo</mat-label>
                          <mat-select [(ngModel)]="field.type" name="editType" [disabled]="field.locked">
                            <mat-option value="text">Texto</mat-option>
                            <mat-option value="image">Imagen</mat-option>
                          </mat-select>
                        </mat-form-field>
                        <mat-form-field appearance="fill">
                          <mat-label>Texto</mat-label>
                          <input matInput [(ngModel)]="field.mapField" name="editMapField" [disabled]="field.locked" />
                        </mat-form-field>
                        <div class="inline">
                          <mat-form-field appearance="fill">
                            <mat-label>Tamaño</mat-label>
                            <input matInput type="number" [(ngModel)]="field.fontSize" name="editFontSize" [disabled]="field.locked" />
                          </mat-form-field>
                          <mat-form-field appearance="fill">
                            <mat-label>Opacidad</mat-label>
                            <input
                              matInput
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              [(ngModel)]="field.opacity"
                              name="editOpacity"
                              [disabled]="field.locked"
                            />
                          </mat-form-field>
                        </div>
                        <div class="inline">
                          <mat-form-field appearance="fill">
                            <mat-label>Color</mat-label>
                            <input matInput type="color" [(ngModel)]="field.color" name="editColor" [disabled]="field.locked" />
                          </mat-form-field>
                          <mat-form-field appearance="fill">
                            <mat-label>Fondo</mat-label>
                            <input matInput type="color" [(ngModel)]="field.backgroundColor" name="editBg" [disabled]="field.locked" />
                          </mat-form-field>
                        </div>
                        <mat-form-field appearance="fill">
                          <mat-label>Fuente</mat-label>
                          <mat-select [(ngModel)]="field.fontFamily" name="editFont" [disabled]="field.locked">
                            <mat-option *ngFor="let font of fonts" [value]="font">{{ font }}</mat-option>
                          </mat-select>
                        </mat-form-field>
                        <mat-form-field appearance="fill">
                          <mat-label>Valor</mat-label>
                          <input matInput [(ngModel)]="field.value" name="editValue" />
                        </mat-form-field>
                        <div class="toggle-row">
                          <mat-slide-toggle [(ngModel)]="field.locked" name="editLocked">Bloquear</mat-slide-toggle>
                          <mat-slide-toggle [(ngModel)]="field.hidden" name="editHidden">Ocultar</mat-slide-toggle>
                        </div>
                        <div class="actions">
                          <button mat-flat-button color="primary" type="button" (click)="confirmEdit()">✅ Guardar</button>
                          <button mat-stroked-button type="button" (click)="duplicateField(field)">Duplicar</button>
                          <button mat-button type="button" (click)="cancelEdit()">Cancelar</button>
                        </div>
                      </form>
                    </div>
                  </div>
                  <div
                    #hitbox
                    class="hitbox"
                    (click)="onHitboxClick($event)"
                    (mousemove)="updateCursor($event)"
                    (mouseleave)="clearCursor()"
                  ></div>
                  <div class="empty" *ngIf="!pageDimensions()">Carga un PDF para empezar a diseñar.</div>
                </div>
              </div>
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
        background: var(--mat-sys-surface-container);
        border-radius: 0.75rem;
        overflow: hidden;
      }
      .pdf-canvas,
      .overlay-canvas,
      .annotations-layer,
      .hitbox,
      .editor-layer {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }
      .pdf-canvas {
        z-index: 1;
      }
      .overlay-canvas {
        z-index: 2;
        pointer-events: none;
      }
      .annotations-layer {
        z-index: 4;
        pointer-events: none;
      }
      .annotations-layer .annotation {
        position: absolute;
        border-radius: 4px;
        border: 1px dashed transparent;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: 4px 6px;
        box-sizing: border-box;
        cursor: move;
        pointer-events: auto;
      }
      .annotations-layer .annotation.selected {
        border-color: var(--mat-sys-primary);
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
      }
      .annotations-layer .annotation.locked {
        cursor: not-allowed;
        opacity: 0.8;
      }
      .hitbox {
        z-index: 3;
        cursor: crosshair;
      }
      .editor-layer {
        z-index: 3;
        pointer-events: none;
      }
      .editor-layer .backdrop {
        position: absolute;
        inset: 0;
        background: transparent;
        pointer-events: auto;
      }
      .floating-editor {
        position: absolute;
        transform: translate(-50%, -10%);
        min-width: 260px;
        max-width: 320px;
        padding: 0.5rem;
        border-radius: 0.75rem;
        background: var(--mat-sys-surface-container-highest);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
        pointer-events: auto;
        display: grid;
        gap: 0.5rem;
      }
      .floating-editor header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .floating-editor .editor-form {
        display: grid;
        gap: 0.35rem;
      }
      .floating-editor .inline {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.35rem;
      }
      .floating-editor .actions {
        display: flex;
        gap: 0.35rem;
        justify-content: flex-end;
        flex-wrap: wrap;
      }
      .floating-editor .toggle-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .floating-editor .header-actions {
        display: inline-flex;
        gap: 0.25rem;
        align-items: center;
      }
      .pdf-stage .empty {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--mat-sys-surface-container);
        z-index: 5;
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
export class TemplateEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly templateService = inject(TemplateService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly shortcuts = inject(KeyboardShortcutsService);
  readonly undoRedo = inject<UndoRedoService<TemplatePage[]>>(UndoRedoService);

  protected readonly version = '1.0.0';
  protected readonly currentYear = new Date().getFullYear();
  protected readonly zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2];
  protected readonly fonts = FONT_OPTIONS;

  @ViewChild('pdfCanvas') pdfCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('overlayCanvas') overlayCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('annotationsLayer') annotationsLayer?: ElementRef<HTMLDivElement>;
  @ViewChild('hitbox') hitbox?: ElementRef<HTMLDivElement>;
  @ViewChild('pdfStage') pdfStage?: ElementRef<HTMLDivElement>;
  @ViewChild('previewModal') previewModal?: ElementRef<HTMLDivElement>;
  @ViewChild('editModal') editModal?: ElementRef<HTMLDivElement>;

  protected readonly zoom = signal(1);
  protected readonly language = signal<'es' | 'en'>('es');
  protected readonly theme = signal<'light' | 'dark'>('light');
  protected readonly mode = signal<'edit' | 'preview'>('edit');
  protected readonly jsonViewMode = signal<'text' | 'tree'>('text');
  protected readonly guides = signal({ grid: false, rulers: false, snap: true });
  protected readonly cursorPdfCoords = signal<{ x: number; y: number } | null>(null);
  protected readonly pdfTotalPages = signal(1);
  protected readonly previewField = signal<TemplateField | null>(null);
  protected readonly editingField = signal<TemplateField | null>(null);

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
  protected readonly totalPages = computed(() => Math.max(this.pages().length || 1, this.pdfTotalPages()));

  protected readonly currentFields = computed(() => {
    const page = this.pages().find((p) => p.num === this.selectedPage());
    return page ? page.fields : [];
  });

  protected readonly selectedField = computed(
    () => this.currentFields().find((f) => f.id === this.selectedFieldId()) ?? null
  );

  private pdfDoc: PDFDocumentProxy | null = null;
  private viewReady = false;
  private currentViewportHeight = 0;
  private currentViewportWidth = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.templateService.getById(id).subscribe({
        next: (tpl) => {
          this.template.set(tpl);
          this.pages.set(JSON.parse(JSON.stringify(tpl.pages)));
          this.selectedPage.set(tpl.pages[0]?.num ?? 1);
          this.undoRedo.clear();
          this.undoRedo.push(this.pages());
          this.loadPdf();
        },
        error: () => {
          this.snack.open('La plantilla no existe o fue eliminada', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/templates']);
        }
      });
    }
    this.shortcuts.registerSaveShortcut(() => this.saveTemplate());
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.loadPdf();
  }

  ngOnDestroy(): void {
    this.shortcuts.cleanup();
  }

  setZoom(level: number): void {
    this.zoom.set(level);
    this.renderCurrentPage();
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

  selectPage(pageNum: number): void {
    this.selectedPage.set(pageNum);
    this.selectedFieldId.set(null);
    this.renderCurrentPage();
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

  addField(type: 'text' | 'image', coords?: { x: number; y: number }): void {
    const field: TemplateField = {
      id: crypto.randomUUID(),
      x: coords?.x ?? 120,
      y: coords?.y ?? 120,
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
    this.openPreview(field);
  }

  onFieldSelected(id: string): void {
    this.selectedFieldId.set(id);
    this.redrawAnnotations();
  }

  onFieldUpdated(field: TemplateField): void {
    this.recordState();
    this.updatePageFields((fields) => fields.map((f) => (f.id === field.id ? field : f)));
    this.selectedFieldId.set(field.id);
    this.redrawAnnotations();
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
      this.redrawAnnotations();
    }
  }

  redo(): void {
    const state = this.undoRedo.redo(this.pages());
    if (state) {
      this.pages.set(state);
      this.redrawAnnotations();
    }
  }

  clearPage(): void {
    this.recordState();
    this.updatePageFields(() => []);
    this.selectedFieldId.set(null);
    this.redrawAnnotations();
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
      this.redrawAnnotations();
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
    this.refreshOverlay();
  }

  async onHitboxClick(event: MouseEvent): Promise<void> {
    if (!this.pageDimensions() || this.editingField()) return;
    if (this.previewField()) this.cancelPreview();
    const coords = this.domToPdfCoords(event);
    if (!coords) return;
    const baseWidth = 200;
    const baseHeight = 32;
    const x = this.clamp(coords.x - baseWidth / 2, 0, Math.max(0, this.currentViewportWidth - baseWidth));
    const y = this.clamp(coords.y - baseHeight / 2, 0, Math.max(0, this.currentViewportHeight - baseHeight));
    this.openPreview({
      id: crypto.randomUUID(),
      x,
      y,
      width: baseWidth,
      height: baseHeight,
      mapField: 'Nuevo texto',
      fontSize: 14,
      color: '#1a1a1a',
      type: 'text',
      fontFamily: 'standard:roboto',
      opacity: 1,
      backgroundColor: '#ffffff',
      locked: false,
      hidden: false,
      value: ''
    });
  }

  updateCursor(event: MouseEvent): void {
    const coords = this.domToPdfCoords(event);
    this.cursorPdfCoords.set(coords);
  }

  clearCursor(): void {
    this.cursorPdfCoords.set(null);
  }

  @HostListener('document:click', ['$event'])
  closeFloatingEditors(event: MouseEvent): void {
    const target = event.target as Node;
    if (this.previewModal?.nativeElement.contains(target) || this.editModal?.nativeElement.contains(target)) return;
    if (this.pdfStage?.nativeElement.contains(target)) return;
    if (this.previewField()) this.cancelPreview();
    if (this.editingField()) this.cancelEdit();
  }

  @HostListener('document:mousedown', ['$event'])
  closeEditOnOutsideMouseDown(event: MouseEvent): void {
    if (!this.editingField()) return;
    const target = event.target as Node;
    if (this.editModal?.nativeElement.contains(target)) return;
    this.cancelEdit();
  }

  confirmPreview(): void {
    const field = this.previewField();
    if (!field || !this.fieldHasRenderableContent(field)) {
      this.cancelPreview();
      return;
    }
    const normalized = this.normalizeField(field);
    this.recordState();
    this.updatePageFields((fields) => [...fields, normalized]);
    this.selectedFieldId.set(normalized.id);
    this.previewField.set(null);
    this.redrawAnnotations();
  }

  cancelPreview(): void {
    this.previewField.set(null);
  }

  confirmEdit(): void {
    const field = this.editingField();
    if (!field || !this.fieldHasRenderableContent(field)) {
      this.cancelEdit();
      return;
    }
    const normalized = this.normalizeField(field);
    this.recordState();
    this.updatePageFields((fields) => fields.map((f) => (f.id === normalized.id ? normalized : f)));
    this.selectedFieldId.set(normalized.id);
    this.editingField.set(null);
    this.redrawAnnotations();
  }

  cancelEdit(): void {
    this.editingField.set(null);
  }

  duplicateField(field: TemplateField): void {
    const clone: TemplateField = {
      ...field,
      id: crypto.randomUUID(),
      x: this.clamp(field.x + 10, 0, Math.max(0, this.currentViewportWidth - (field.width ?? 180))),
      y: this.clamp(field.y + 10, 0, Math.max(0, this.currentViewportHeight - (field.height ?? 28)))
    };
    this.recordState();
    this.updatePageFields((fields) => [...fields, clone]);
    this.startEditing(clone);
    this.redrawAnnotations();
  }

  deleteAnnotation(id?: string): void {
    const targetId = id ?? this.editingField()?.id;
    if (!targetId) return;
    this.recordState();
    this.updatePageFields((fields) => fields.filter((f) => f.id !== targetId));
    if (this.selectedFieldId() === targetId) {
      this.selectedFieldId.set(null);
    }
    this.cancelEdit();
    this.redrawAnnotations();
  }

  editorStyle(field: TemplateField): { left: string; top: string } {
    const position = this.computeModalPosition(field);
    return { left: `${position.left}px`, top: `${position.top}px` };
  }

  pageSizeLabel(pageNum: number): string {
    const dims = this.pdfDimensions().find((d) => d.num === pageNum);
    return dims ? `${Math.round(dims.width)} × ${Math.round(dims.height)} px` : 'Sin medidas';
  }

  private async loadPdf(): Promise<void> {
    const src = this.template()?.pdfUrl;
    if (!src || !this.viewReady) return;
    this.pdfDoc = await getDocument(src as any).promise;
    this.pdfTotalPages.set(this.pdfDoc.numPages);
    this.alignPagesWithPdf();
    await this.renderCurrentPage();
  }

  private alignPagesWithPdf(): void {
    if (!this.pdfDoc) return;
    const total = this.pdfDoc.numPages;
    this.pages.update((current) => {
      const byNumber = new Map(current.map((page) => [page.num, page]));
      const normalized: TemplatePage[] = [];
      for (let num = 1; num <= total; num++) {
        normalized.push(byNumber.get(num) ?? { num, fields: [] });
      }
      return normalized;
    });
    if (this.selectedPage() > total) {
      this.selectedPage.set(total);
    }
  }

  private async renderCurrentPage(): Promise<void> {
    if (!this.pdfDoc || !this.pdfCanvas || !this.overlayCanvas || !this.annotationsLayer) return;

    const safePage = Math.min(this.selectedPage(), this.pdfDoc.numPages);
    if (safePage !== this.selectedPage()) {
      this.selectedPage.set(safePage);
    }
    const page = await this.pdfDoc.getPage(safePage);
    const viewport = page.getViewport({ scale: this.zoom() });

    const pdfCanvas = this.pdfCanvas.nativeElement;
    const overlayCanvas = this.overlayCanvas.nativeElement;
    const annotationsLayer = this.annotationsLayer.nativeElement;

    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;
    pdfCanvas.style.width = `${viewport.width}px`;
    pdfCanvas.style.height = `${viewport.height}px`;

    overlayCanvas.width = viewport.width;
    overlayCanvas.height = viewport.height;
    overlayCanvas.style.width = `${viewport.width}px`;
    overlayCanvas.style.height = `${viewport.height}px`;

    annotationsLayer.style.width = `${viewport.width}px`;
    annotationsLayer.style.height = `${viewport.height}px`;

    const ctx = pdfCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, viewport.width, viewport.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
    }

    this.pageDimensions.set({ num: safePage, width: viewport.width, height: viewport.height });
    this.pdfDimensions.update((current) => {
      const filtered = current.filter((item) => item.num !== safePage);
      return [...filtered, { num: safePage, width: viewport.width, height: viewport.height }];
    });

    this.currentViewportHeight = viewport.height;
    this.currentViewportWidth = viewport.width;

    this.refreshOverlay();
    this.redrawAnnotations();
  }

  private refreshOverlay(): void {
    const canvas = this.overlayCanvas?.nativeElement;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.guides().grid) {
      this.drawGrid(ctx, canvas.width, canvas.height);
    }
    if (this.guides().rulers) {
      this.drawRulers(ctx, canvas.width, canvas.height);
    }
    this.drawStaticGuides(ctx, canvas.width, canvas.height);
  }

  private drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const step = 40 * this.zoom();
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawRulers(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const step = 40 * this.zoom();
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 12);
      ctx.stroke();
      ctx.fillText(Math.round(x / this.zoom()).toString(), x + 2, 10);
    }

    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(12, y);
      ctx.stroke();
      ctx.fillText(Math.round(y / this.zoom()).toString(), 4, y + 10);
    }

    ctx.restore();
  }

  private drawStaticGuides(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 126, 245, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 6]);

    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    ctx.restore();
  }

  private redrawAnnotations(): void {
    const layer = this.annotationsLayer?.nativeElement;
    if (!layer || !this.pageDimensions()) return;
    layer.innerHTML = '';

    this.currentFields().forEach((field) => {
      const el = document.createElement('div');
      el.classList.add('annotation');
      if (field.id === this.selectedFieldId()) {
        el.classList.add('selected');
      }
      if (field.locked) {
        el.classList.add('locked');
      }

      this.positionElement(el, field, field.x, field.y);

      el.style.background = field.backgroundColor || 'rgba(255,255,255,0.85)';
      el.style.color = field.color;
      el.style.opacity = `${field.opacity}`;
      el.style.fontFamily = field.fontFamily;
      el.style.fontSize = `${field.fontSize * this.zoom()}px`;
      el.innerText = field.value ?? field.mapField;

      el.addEventListener('click', (evt) => evt.stopPropagation());
      el.addEventListener('pointerdown', (evt) => this.handleFieldPointerDown(evt, field, el));
      layer.appendChild(el);
    });
  }

  private handleFieldPointerDown(event: PointerEvent, field: TemplateField, element: HTMLElement): void {
    event.stopPropagation();
    this.selectedFieldId.set(field.id);
    if (this.previewField()) {
      this.cancelPreview();
    }

    if (field.locked) {
      this.startEditing(field);
      return;
    }

    const startPoint = { x: event.clientX, y: event.clientY };
    const startCoords = this.domToPdfCoords(event);
    if (!startCoords) return;

    const offsetX = startCoords.x - field.x;
    const offsetY = startCoords.y - field.y;
    let dragged = false;

    const move = (moveEvent: PointerEvent) => {
      const coords = this.domToPdfCoords(moveEvent);
      if (!coords) return;
      const distance = Math.hypot(moveEvent.clientX - startPoint.x, moveEvent.clientY - startPoint.y);
      if (distance > 3) {
        dragged = true;
      }
      if (!dragged) return;
      const newX = this.clamp(
        coords.x - offsetX,
        0,
        Math.max(0, this.currentViewportWidth - (field.width ?? 180))
      );
      const newY = this.clamp(
        coords.y - offsetY,
        0,
        Math.max(0, this.currentViewportHeight - (field.height ?? 28))
      );
      this.positionElement(element, field, newX, newY);
    };

    const up = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      const coords = this.domToPdfCoords(upEvent);
      const newX = coords
        ? this.clamp(coords.x - offsetX, 0, Math.max(0, this.currentViewportWidth - (field.width ?? 180)))
        : field.x;
      const newY = coords
        ? this.clamp(coords.y - offsetY, 0, Math.max(0, this.currentViewportHeight - (field.height ?? 28)))
        : field.y;
      if (dragged) {
        this.onFieldUpdated({ ...field, x: newX, y: newY });
      } else {
        this.startEditing(field);
      }
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  }

  private domToPdfCoords(event: MouseEvent): { x: number; y: number } | null {
    if (!this.pdfStage) return null;
    const rect = this.pdfStage.nativeElement.getBoundingClientRect();
    const x = (event.clientX - rect.left) / this.zoom();
    const y = this.currentViewportHeight - (event.clientY - rect.top) / this.zoom();
    if (Number.isNaN(x) || Number.isNaN(y)) return null;
    return { x, y };
  }

  private positionElement(el: HTMLElement, field: TemplateField, x: number, y: number): void {
    const width = (field.width ?? 180) * this.zoom();
    const height = (field.height ?? 28) * this.zoom();
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    el.style.left = `${x * this.zoom()}px`;
    el.style.top = `${(this.currentViewportHeight - y - (field.height ?? 28)) * this.zoom()}px`;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private openPreview(field: TemplateField): void {
    this.editingField.set(null);
    this.previewField.set({ ...field });
  }

  private startEditing(field: TemplateField): void {
    this.previewField.set(null);
    this.editingField.set({ ...field });
    this.selectedFieldId.set(field.id);
  }

  private computeModalPosition(field: TemplateField): { left: number; top: number } {
    const left = (field.x + (field.width ?? 180) / 2) * this.zoom();
    const top = (this.currentViewportHeight - field.y) * this.zoom();
    return { left, top };
  }

  private fieldHasRenderableContent(field: TemplateField): boolean {
    return Boolean((field.mapField ?? '').trim() || field.value || field.type === 'image');
  }

  private normalizeField(field: TemplateField): TemplateField {
    return {
      ...field,
      mapField: (field.mapField ?? '').trim() || 'Campo',
      fontSize: Number(field.fontSize) || 12,
      opacity: this.clamp(Number(field.opacity) || 0, 0, 1),
      width: Number(field.width) || 200,
      height: Number(field.height) || 32
    };
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
