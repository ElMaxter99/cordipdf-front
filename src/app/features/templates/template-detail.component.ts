import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { Template } from '../../core/models/template.model';
import { TemplateService } from '../../services/template.service';
import { TemplateFormComponent } from './template-form.component';

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule, TemplateFormComponent],
  template: `
    <ng-container *ngIf="template; else notFound">
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-semibold">{{ template.name }}</h1>
            <p class="text-sm text-surface-variant">{{ template.description }}</p>
          </div>
          <div class="flex gap-2">
            <a mat-stroked-button [routerLink]="['/templates']">Volver</a>
            <a mat-flat-button color="accent" [routerLink]="['/editor', template.id]">
              <mat-icon>draw</mat-icon>
              Abrir editor
            </a>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1 space-y-2">
            <div class="flex items-center gap-2 text-surface-variant text-sm">
              <mat-icon>calendar_today</mat-icon>
              Creada el {{ template.createdAt | date: 'mediumDate' }}
            </div>
            <div class="flex items-center gap-2 text-surface-variant text-sm">
              <mat-icon>update</mat-icon>
              Actualizada {{ template.updatedAt | date: 'short' }}
            </div>
            <div class="flex items-center gap-2 text-surface-variant text-sm">
              <mat-icon>layers</mat-icon>
              {{ template.pages.length }} páginas configuradas
            </div>
          </div>

          <div class="w-full md:w-1/2">
            <app-template-form [template]="template" (saved)="onUpdated($event)" />
          </div>
        </div>
      </div>
    </ng-container>

    <ng-template #notFound>
      <div class="p-6 border border-dashed border-outline rounded-xl text-center text-surface-variant">
        <p>Plantilla no encontrada.</p>
        <a mat-flat-button color="primary" routerLink="/templates" class="mt-3 inline-flex">Volver al listado</a>
      </div>
    </ng-template>
  `
})
export class TemplateDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly templateService = inject(TemplateService);

  template?: Template;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.templateService.getById(id).subscribe((template) => {
      if (template) this.template = template;
    });
  }

  onUpdated(template: Template) {
    this.template = template;
  }
}
