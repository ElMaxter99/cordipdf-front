import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TemplateService } from '../../services/template.service';
import { TemplateModel } from '../../shared/models/template.model';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
  template: `
    <mat-card>
      <mat-card-title>Nueva plantilla</mat-card-title>
      <mat-card-content>
        <form [formGroup]="form" class="space-y-4" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="name" required />
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Descripción</mat-label>
            <textarea matInput rows="3" formControlName="description"></textarea>
          </mat-form-field>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Subir PDF</label>
            <input type="file" accept="application/pdf" (change)="onFileSelected($event)" />
            <span class="text-xs text-slate-500" *ngIf="pdfUrl">Usando archivo: {{ pdfUrl }}</span>
          </div>
          <button mat-raised-button color="primary" [disabled]="form.invalid">Crear plantilla</button>
        </form>
      </mat-card-content>
    </mat-card>
  `
})
export class TemplateFormComponent {
  @Output() created = new EventEmitter<TemplateModel>();

  pdfUrl: string | null = null;
  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  constructor(private readonly fb: FormBuilder, private readonly templateService: TemplateService) {}

  submit(): void {
    if (this.form.invalid) return;
    this.templateService
      .create({
        name: this.form.value.name ?? 'Nueva plantilla',
        description: this.form.value.description ?? '',
        pdfUrl: this.pdfUrl ?? 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
      })
      .subscribe((template) => {
        this.form.reset();
        this.created.emit(template);
      });
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.templateService.uploadPdf(file).subscribe((url) => (this.pdfUrl = url));
    }
  }
}
