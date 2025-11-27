import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import { Template } from '../../core/models/template.model';
import { TemplateService } from '../../services/template.service';
import { TemplateFormComponent } from './template-form.component';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    TemplateFormComponent
  ],
  template: `
    <section class="flex flex-col gap-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold">Plantillas PDF</h1>
          <p class="text-sm text-surface-variant">Gestiona tus plantillas y abre el editor visual.</p>
        </div>
        <button mat-flat-button color="primary" (click)="toggleCreate()">
          <mat-icon>add</mat-icon>
          Nueva plantilla
        </button>
      </div>

      <app-template-form *ngIf="creating" (saved)="onCreated($event)" (cancel)="toggleCreate()" />

      <div *ngIf="templates?.length; else empty" class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <mat-card *ngFor="let template of templates" appearance="outlined" class="flex flex-col">
          <mat-card-header>
            <div mat-card-avatar class="bg-primary/10 rounded-full p-3 flex items-center justify-center">
              <mat-icon class="text-primary">picture_as_pdf</mat-icon>
            </div>
            <mat-card-title class="line-clamp-1">{{ template.name }}</mat-card-title>
            <mat-card-subtitle>Actualizado {{ template.updatedAt | date: 'short' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="flex-1">
            <p class="text-sm text-surface-variant line-clamp-3">{{ template.description }}</p>
            <mat-divider class="my-3"></mat-divider>
            <div class="flex items-center gap-2 text-xs text-surface-variant">
              <mat-icon class="text-base">layers</mat-icon>
              {{ template.pages.length }} páginas
            </div>
          </mat-card-content>
          <mat-card-actions align="end" class="flex justify-between items-center">
            <div class="flex gap-2 items-center">
              <a mat-stroked-button color="primary" [routerLink]="['/templates', template.id]">Detalles</a>
              <a mat-flat-button color="accent" [routerLink]="['/editor', template.id]">
                <mat-icon>edit</mat-icon>
                Editar
              </a>
            </div>
            <button mat-icon-button color="warn" aria-label="Eliminar" (click)="delete(template.id)">
              <mat-icon>delete</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <ng-template #empty>
        <div class="p-6 border border-dashed border-outline rounded-xl text-center text-surface-variant">
          <mat-icon class="text-4xl mb-2 text-outline">feed</mat-icon>
          <p>No hay plantillas. Crea la primera para empezar.</p>
        </div>
      </ng-template>
    </section>
  `
})
export class TemplateListComponent implements OnInit {
  private readonly templateService = inject(TemplateService);
  templates: Template[] = [];
  creating = false;

  ngOnInit(): void {
    this.templateService.getAll().subscribe((templates) => (this.templates = templates));
  }

  toggleCreate() {
    this.creating = !this.creating;
  }

  onCreated(template: Template) {
    this.templates = [...this.templates, template];
    this.creating = false;
  }

  delete(id: string) {
    this.templateService.delete(id).subscribe(() => {
      this.templates = this.templates.filter((t) => t.id !== id);
    });
  }
}
