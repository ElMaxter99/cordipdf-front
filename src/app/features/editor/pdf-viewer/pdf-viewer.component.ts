import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';

import { PdfPageView } from '../../../core/models/pdf-page.model';

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)
  .toString();

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [NgFor, NgIf, MatProgressSpinnerModule, MatCardModule],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss'
})
export class PdfViewerComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) src!: string | Uint8Array;
  @Input() scale = 1;
  @Output() pageRendered = new EventEmitter<PdfPageView>();

  @ViewChildren('pageCanvas', { read: ElementRef })
  canvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  loading = true;
  pageCount = 0;
  private documentRef?: PDFDocumentProxy;

  get pageIndices(): number[] {
    return Array.from({ length: this.pageCount }, (_, i) => i + 1);
  }

  async ngAfterViewInit(): Promise<void> {
    await this.loadDocument();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['src'] && !changes['src'].firstChange) {
      await this.loadDocument();
    }
    if (changes['scale'] && !changes['scale'].firstChange) {
      await this.renderAllPages();
    }
  }

  private async loadDocument(): Promise<void> {
    if (!this.src) return;
    this.loading = true;
    this.documentRef = await getDocument(this.src).promise;
    this.pageCount = this.documentRef.numPages;
    await new Promise((resolve) => setTimeout(resolve));
    await this.renderAllPages();
    this.loading = false;
  }

  private async renderAllPages(): Promise<void> {
    if (!this.documentRef) return;
    for (let i = 1; i <= this.documentRef.numPages; i++) {
      const canvasEl = this.canvases.get(i - 1)?.nativeElement;
      if (canvasEl) {
        await this.renderPage(i, canvasEl);
      }
    }
  }

  private async renderPage(pageNumber: number, canvas: HTMLCanvasElement): Promise<void> {
    if (!this.documentRef) return;
    const page = await this.documentRef.getPage(pageNumber);
    const viewport = page.getViewport({ scale: this.scale });
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    this.pageRendered.emit({
      num: pageNumber,
      width: viewport.width,
      height: viewport.height,
      scale: this.scale
    });
  }
}
