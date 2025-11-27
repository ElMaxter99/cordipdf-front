import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TemplateService } from '../../services/template.service';
import { TemplateModel } from '../../shared/models/template.model';
import { TemplateFormComponent } from './template-form.component';

@Component({
  selector: 'app-templates-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf, NgFor, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatTooltipModule, TemplateFormComponent],
  template: `
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-4">
        <h2 class="text-2xl font-bold">Plantillas PDF</h2>
        <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <mat-card *ngFor="let template of templates()" class="relative">
            <mat-card-header>
              <mat-card-title class="truncate" [matTooltip]="template.name">{{ template.name }}</mat-card-title>
              <mat-card-subtitle class="truncate" [matTooltip]="template.description">
                {{ template.description || 'Sin descripción' }}
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <mat-icon fontIcon="picture_as_pdf"></mat-icon>
                {{ template.pages.length }} páginas
              </div>
              <div class="flex gap-2 flex-wrap">
                <mat-chip-option color="primary" selected>Páginas: {{ template.pages.length }}</mat-chip-option>
                <mat-chip-option color="accent">Campos: {{ countFields(template) }}</mat-chip-option>
              </div>
            </mat-card-content>
            <mat-card-actions class="flex justify-between items-center">
              <button mat-stroked-button color="primary" [routerLink]="['/templates', template.id]">Ver</button>
              <div class="flex gap-2">
                <button mat-icon-button color="primary" [routerLink]="['/editor', template.id]" matTooltip="Abrir editor">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="remove(template)" matTooltip="Eliminar">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
      <div class="space-y-4">
        <app-template-form (created)="onCreated($event)"></app-template-form>
      </div>
    </div>
  `
})
export class TemplatesShellComponent implements OnInit {
  private readonly templateService = inject(TemplateService);
  readonly templates = signal<TemplateModel[]>([]);

  ngOnInit(): void {
    this.templateService.getAll().subscribe((items) => this.templates.set(items));
  }

  onCreated(template: TemplateModel): void {
    this.templates.update((list) => [template, ...list]);
  }

  countFields(template: TemplateModel): number {
    return template.pages.reduce((acc, page) => acc + page.fields.length, 0);
  }

  remove(template: TemplateModel): void {
    if (confirm(`¿Eliminar ${template.name}?`)) {
      this.templateService.delete(template.id).subscribe(() => {
        this.templates.update((items) => items.filter((t) => t.id !== template.id));
      });
    }
  }
}
