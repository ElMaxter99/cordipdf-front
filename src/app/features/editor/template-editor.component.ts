import { AsyncPipe, NgIf } from '@angular/common';
import { Component, HostListener, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TemplateService } from '../../services/template.service';
import { PdfTemplate, TemplateField, TemplatePage } from '../../shared/models/template.model';
import { HistoryStack } from '../../utils/history-stack';
import { EditorToolbarComponent } from './components/editor-toolbar.component';
import { FieldPropertiesPanelComponent } from './components/field-properties-panel.component';
import { PdfViewerComponent } from './components/pdf-viewer.component';

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    EditorToolbarComponent,
    FieldPropertiesPanelComponent,
    PdfViewerComponent
  ],
  templateUrl: './template-editor.component.html',
  styleUrl: './template-editor.component.scss'
})
export class TemplateEditorComponent implements OnInit {
  template?: PdfTemplate;
  pages: TemplatePage[] = [];
  selectedField: TemplateField | null = null;
  zoom = 1;
  saving = signal(false);
  history = new HistoryStack<TemplatePage[]>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly templateService: TemplateService,
    private readonly snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.templateService.getById(id).subscribe((tpl) => {
      if (!tpl) return;
      this.template = tpl;
      this.pages = structuredClone(tpl.pages);
      this.history.push(this.pages);
    });
  }

  @HostListener('document:keydown.control.s', ['$event'])
  onCtrlS(event: KeyboardEvent): void {
    event.preventDefault();
    this.save();
  }

  handleFieldsChange(pages: TemplatePage[]): void {
    this.pages = structuredClone(pages);
    this.history.push(this.pages);
  }

  handleSelect(selection: { page: number; fieldId: string }): void {
    const page = this.pages.find((p) => p.num === selection.page);
    const field = page?.fields.find((f) => f.id === selection.fieldId) ?? null;
    this.selectedField = field;
  }

  addField(): void {
    if (!this.pages.length) {
      this.pages = [{ num: 1, fields: [] }];
    }
    const field: TemplateField = {
      id: crypto.randomUUID(),
      type: 'text',
      mapField: 'Nuevo campo',
      x: 50,
      y: 50,
      width: 180,
      height: 40,
      fontSize: 16,
      color: '#111827',
      fontFamily: 'standard:roboto',
      opacity: 1,
      backgroundColor: '#e2e8f0',
      locked: false,
      hidden: false,
      value: 'Texto',
      multiline: false
    };
    this.pages[0].fields.push(field);
    this.selectedField = field;
    this.history.push(this.pages);
  }

  updateField(partial: Partial<TemplateField>): void {
    if (!this.selectedField) return;
    const page = this.pages.find((p) => p.fields.some((f) => f.id === this.selectedField!.id));
    if (!page) return;
    page.fields = page.fields.map((f) => (f.id === this.selectedField!.id ? { ...f, ...partial } : f));
    this.selectedField = page.fields.find((f) => f.id === this.selectedField!.id) ?? null;
    this.history.push(this.pages);
  }

  save(): void {
    if (!this.template) return;
    this.saving.set(true);
    this.templateService.saveLayout(this.template.id, this.pages).subscribe((payload) => {
      this.saving.set(false);
      this.snack.open('Plantilla guardada', 'Cerrar', { duration: 2000 });
      console.info('Payload enviado', payload);
    });
  }

  undo(): void {
    const prev = this.history.undo(this.pages);
    if (prev) {
      this.pages = prev;
    }
  }

  redo(): void {
    const next = this.history.redo(this.pages);
    if (next) {
      this.pages = next;
    }
  }

  goBack(): void {
    this.router.navigate(['/templates']);
  }

  get canUndo(): boolean {
    return this.history.canUndo();
  }

  get canRedo(): boolean {
    return this.history.canRedo();
  }
}
