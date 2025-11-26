import { NgFor } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
  ElementRef
} from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { TemplatePage } from '../../../shared/models/template.model';
import { EditorCanvasComponent } from './editor-canvas.component';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [NgFor, EditorCanvasComponent],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss'
})
export class PdfViewerComponent implements AfterViewInit, OnChanges {
  @Input() src!: string;
  @Input() pages: TemplatePage[] = [];
  @Input() scale = 1;
  @Input() selectedFieldId?: string;

  @Output() selectField = new EventEmitter<{ page: number; fieldId: string }>();
  @Output() fieldsChange = new EventEmitter<TemplatePage[]>();

  @ViewChildren('pageCanvas') canvasRefs!: QueryList<ElementRef<HTMLCanvasElement>>;

  pageDimensions: { num: number; width: number; height: number }[] = [];

  async ngAfterViewInit(): Promise<void> {
    await this.preparePages();
    await this.renderPages();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['src'] && !changes['src'].firstChange) {
      await this.preparePages();
      await this.renderPages();
    }
    if (changes['scale'] && !changes['scale'].firstChange) {
      await this.renderPages();
    }
  }

  trackByPage = (_: number, page: { num: number }) => page.num;

  private async preparePages(): Promise<void> {
    if (!this.src) return;
    const pdf = await pdfjsLib.getDocument(this.src).promise;
    const pages: TemplatePage[] = [];
    const dimensions: { num: number; width: number; height: number }[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      dimensions.push({ num: i, width: viewport.width, height: viewport.height });
      pages.push({ num: i, fields: this.pages.find((p) => p.num === i)?.fields ?? [] });
    }
    this.pageDimensions = dimensions;
    this.pages = pages;
  }

  async renderPages(): Promise<void> {
    if (!this.src) return;
    await Promise.resolve();
    const pdf = await pdfjsLib.getDocument(this.src).promise;
    const canvases = this.canvasRefs.toArray();
    if (!canvases.length) return;
    for (const canvasRef of canvases) {
      const canvas = canvasRef.nativeElement;
      const pageNum = Number(canvas.dataset['page']);
      const page = await pdf.getPage(pageNum);
      const dims = this.pageDimensions.find((p) => p.num === pageNum);
      const viewport = page.getViewport({ scale: this.scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
      }
      if (dims) {
        dims.width = viewport.width / this.scale;
        dims.height = viewport.height / this.scale;
      }
    }
  }

  onFieldsChange(page: TemplatePage, fields: TemplatePage['fields']): void {
    const updated = this.pages.map((p) => (p.num === page.num ? { ...p, fields } : p));
    this.pages = updated;
    this.fieldsChange.emit(updated);
  }

  onSelect(page: TemplatePage, fieldId: string): void {
    this.selectField.emit({ page: page.num, fieldId });
  }
}
