import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #canvas class="shadow rounded w-full"></canvas>
  `
})
export class PdfViewerComponent implements AfterViewInit, OnChanges {
  @Input() src?: string | ArrayBuffer;
  @Input() page = 1;
  @Input() zoom = 1;
  @Output() rendered = new EventEmitter<{ width: number; height: number; page: number }>();
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private pdfDoc?: PDFDocumentProxy;
  private lastSrc?: string | ArrayBuffer;

  async ngAfterViewInit() {
    await this.loadAndRender();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['src'] || changes['page'] || changes['zoom']) {
      await this.loadAndRender();
    }
  }

  private async loadAndRender() {
    if (!this.src) return;
    if (!this.pdfDoc || this.srcChanged()) {
      const source = typeof this.src === 'string' ? { url: this.src } : { data: this.src };
      this.pdfDoc = await pdfjsLib.getDocument(source).promise;
      this.lastSrc = this.src;
    }

    const pdfPage = await this.pdfDoc.getPage(this.page);
    const viewport = pdfPage.getViewport({ scale: this.zoom });
    const canvas = this.canvasRef.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await pdfPage.render({ canvasContext: context, viewport }).promise;
    this.rendered.emit({ width: viewport.width, height: viewport.height, page: this.page });
  }

  private srcChanged() {
    return this.lastSrc !== this.src;
  }
}
