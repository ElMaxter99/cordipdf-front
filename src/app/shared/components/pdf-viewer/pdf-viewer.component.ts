import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';
import type { RenderParameters } from 'pdfjs-dist/types/src/display/api';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs';

GlobalWorkerOptions.workerSrc = new URL(pdfjsWorker, import.meta.url).toString();

export interface PdfPageDimensions {
  num: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pdf-container" #container></div>
  `,
  styles: [
    `
      .pdf-container {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      canvas {
        width: 100%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
        border-radius: 0.75rem;
      }
    `
  ]
})
export class PdfViewerComponent implements AfterViewInit, OnChanges {
  @Input() src: string | ArrayBuffer | null = null;
  @Input() zoom = 1;
  @Input() page = 1;
  @Output() dimensions = new EventEmitter<PdfPageDimensions[]>();

  @ViewChild('container', { static: true }) container?: ElementRef<HTMLDivElement>;

  private pdf: PDFDocumentProxy | null = null;

  ngAfterViewInit(): void {
    if (this.src) {
      this.loadPdf();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && !changes['src'].firstChange) {
      this.loadPdf();
    }
    if ((changes['zoom'] || changes['page']) && !changes['zoom']?.firstChange && this.pdf) {
      this.renderPages();
    }
  }

  private async loadPdf(): Promise<void> {
    if (!this.src || !this.container) return;
    this.container.nativeElement.innerHTML = '';
    this.pdf = await getDocument(this.src as any).promise;
    await this.renderPages();
  }

  private async renderPages(): Promise<void> {
    if (!this.pdf || !this.container) return;
    const dims: PdfPageDimensions[] = [];
    this.container.nativeElement.innerHTML = '';

    const targetPages = this.page ? [this.page] : Array.from({ length: this.pdf.numPages }, (_, idx) => idx + 1);

    for (const pageNumber of targetPages) {
      const page = await this.pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: this.zoom });
      const canvas = document.createElement('canvas');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const context = canvas.getContext('2d');
      if (!context) continue;
      const renderContext: RenderParameters = {
        canvasContext: context,
        viewport
      };
      await page.render(renderContext).promise;
      this.container.nativeElement.appendChild(canvas);
      dims.push({ num: pageNumber, width: viewport.width, height: viewport.height });
    }

    this.dimensions.emit(dims);
  }
}
