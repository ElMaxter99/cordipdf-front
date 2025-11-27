import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GlobalWorkerOptions, getDocument, version } from 'pdfjs-dist';

// Configure worker
GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();

export interface PdfPageInfo {
  num: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [NgIf, MatProgressSpinnerModule],
  template: `
    <div class="relative w-full" #container>
      <div class="mb-4 text-sm text-slate-500 flex items-center gap-2" *ngIf="loading">
        <mat-spinner diameter="24"></mat-spinner>
        <span>Cargando PDF ({{ pdfJsVersion }})...</span>
      </div>
      <div #pagesHost class="space-y-6"></div>
    </div>
  `,
  styles: [
    `
      canvas {
        width: 100%;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      }
    `
  ]
})
export class PdfViewerComponent implements OnChanges {
  @Input() src = '';
  @Input() scale = 1;
  @Input() page = 1;
  @Output() pageRendered = new EventEmitter<PdfPageInfo>();

  @ViewChild('pagesHost', { static: true }) pagesHost!: ElementRef<HTMLDivElement>;
  loading = false;
  readonly pdfJsVersion = version;

  constructor(private readonly renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] || changes['scale']) {
      this.renderDocument();
    }
  }

  private async renderDocument(): Promise<void> {
    if (!this.src) {
      return;
    }
    this.loading = true;
    this.pagesHost.nativeElement.innerHTML = '';

    try {
      const task = getDocument(this.src);
      const pdf = await task.promise;
      const targetPage = Math.min(Math.max(this.page, 1), pdf.numPages);
      const page = await pdf.getPage(targetPage);
      const viewport = page.getViewport({ scale: this.scale });
      const canvas = this.renderer.createElement('canvas') as HTMLCanvasElement;
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const renderContext = {
        canvasContext: context!,
        viewport
      };
      await page.render(renderContext).promise;
      this.renderer.appendChild(this.pagesHost.nativeElement, canvas);
      this.pageRendered.emit({
        num: targetPage,
        width: viewport.width,
        height: viewport.height
      });
    } catch (error) {
      console.error('Error rendering PDF', error);
    } finally {
      this.loading = false;
    }
  }
}
