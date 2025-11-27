import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TemplateService } from '../../services/template.service';
import { TemplateModel } from '../../shared/models/template.model';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatChipsModule,
    MatIconModule
  ],
  template: `
    <ng-container *ngIf="template(); else loading">
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">{{ template()?.name }}</h2>
            <p class="text-sm text-slate-500">Última actualización: {{ template()?.updatedAt | date:'short' }}</p>
          </div>
          <button mat-raised-button color="primary" (click)="goToEditor()">
            <mat-icon fontIcon="edit"></mat-icon>
            Abrir editor
          </button>
        </div>
        <mat-card>
          <mat-card-title>Metadatos</mat-card-title>
          <mat-card-content class="space-y-3">
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Nombre</mat-label>
              <input matInput [(ngModel)]="draft.name" />
            </mat-form-field>
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Descripción</mat-label>
              <textarea matInput rows="3" [(ngModel)]="draft.description"></textarea>
            </mat-form-field>
            <div class="flex gap-2 items-center">
              <span class="text-sm">PDF:</span>
              <a [href]="template()?.pdfUrl" target="_blank" class="text-primary-600 underline">Descargar</a>
            </div>
            <div class="flex gap-2 flex-wrap">
              <mat-chip-option color="primary" selected>{{ template()?.pages.length }} páginas</mat-chip-option>
              <mat-chip-option color="accent">{{ fieldsCount() }} campos</mat-chip-option>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-stroked-button color="primary" (click)="save()">Guardar cambios</button>
            <button mat-stroked-button (click)="reset()">Restablecer</button>
          </mat-card-actions>
        </mat-card>
      </div>
    </ng-container>
    <ng-template #loading>
      <div class="p-8 text-center text-slate-500">Cargando plantilla...</div>
    </ng-template>
  `
})
export class TemplateDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly templateService = inject(TemplateService);

  readonly template = signal<TemplateModel | null>(null);
  draft: Partial<TemplateModel> = {};

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.templateService.getById(id).subscribe((item) => {
      if (item) {
        this.template.set(item);
        this.draft = { name: item.name, description: item.description };
      }
    });
  }

  fieldsCount(): number {
    return this.template()?.pages.reduce((acc, page) => acc + page.fields.length, 0) ?? 0;
  }

  save(): void {
    const current = this.template();
    if (!current) return;
    this.templateService
      .update(current.id, {
        ...current,
        name: this.draft.name ?? current.name,
        description: this.draft.description ?? current.description
      })
      .subscribe((updated) => {
        if (updated) {
          this.template.set(updated);
        }
      });
  }

  reset(): void {
    const current = this.template();
    if (current) {
      this.draft = { name: current.name, description: current.description };
    }
  }

  goToEditor(): void {
    const current = this.template();
    if (current) {
      this.router.navigate(['/editor', current.id]);
    }
  }
}
