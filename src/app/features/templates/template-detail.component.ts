import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Template } from '../../shared/models/template.model';
import { TemplateService } from '../../services/template.service';

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, DatePipe],
  template: `
    <mat-card class="page-card" *ngIf="template">
      <div class="header">
        <div>
          <button mat-button color="primary" [routerLink]="['/templates']">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
          <h2>{{ template.name }}</h2>
          <p class="muted">{{ template.description }}</p>
        </div>
        <div class="cta">
          <a mat-flat-button color="primary" [routerLink]="['/editor', template.id]">
            <mat-icon>design_services</mat-icon>
            Abrir editor
          </a>
        </div>
      </div>
      <div class="meta">
        <mat-chip-listbox aria-label="info">
          <mat-chip>Actualizada: {{ template.updatedAt | date: 'short' }}</mat-chip>
          <mat-chip>Páginas: {{ template.pages.length }}</mat-chip>
        </mat-chip-listbox>
      </div>
      <div class="preview">
        <p class="muted">Preview rápida del JSON guardado:</p>
        <pre>{{ template.pages | json }}</pre>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .page-card {
        padding: 1.5rem;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
      }
      h2 {
        margin: 0.25rem 0;
      }
      .muted {
        color: var(--mat-sys-on-surface-variant);
      }
      .meta {
        margin-top: 1rem;
      }
      .preview {
        margin-top: 1.5rem;
        background: color-mix(in srgb, var(--mat-sys-primary) 4%, transparent);
        border-radius: 0.75rem;
        padding: 1rem;
        overflow: auto;
      }
      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
      }
    `
  ]
})
export class TemplateDetailComponent implements OnInit {
  protected template?: Template;
  private readonly route = inject(ActivatedRoute);
  private readonly templateService = inject(TemplateService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.templateService.getById(id).subscribe((template) => (this.template = template));
    }
  }
}
