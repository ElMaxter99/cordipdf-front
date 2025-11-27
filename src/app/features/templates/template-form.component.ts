import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { Template, TemplatePayload } from '../../core/models/template.model';
import { TemplateService } from '../../services/template.service';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-4 rounded-xl border border-outline flex flex-col gap-3 bg-surface">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold">{{ template ? 'Editar' : 'Nueva' }} plantilla</h2>
        <button type="button" mat-icon-button (click)="cancel.emit()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Nombre</mat-label>
        <input matInput formControlName="name" required />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Descripción</mat-label>
        <textarea matInput rows="3" formControlName="description"></textarea>
      </mat-form-field>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium">Archivo PDF</label>
        <input type="file" accept="application/pdf" (change)="onFileSelected($event)" />
        <p class="text-xs text-surface-variant" *ngIf="form.value.pdfUrl">PDF cargado correctamente.</p>
      </div>

      <div class="flex gap-2 justify-end">
        <button mat-stroked-button type="button" (click)="cancel.emit()">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
      </div>
    </form>
  `
})
export class TemplateFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly templateService = inject(TemplateService);

  @Input() template?: Template;
  @Output() saved = new EventEmitter<Template>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    pdfUrl: ['', Validators.required]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['template'] && this.template) {
      this.form.patchValue({
        name: this.template.name,
        description: this.template.description,
        pdfUrl: this.template.pdfUrl
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.templateService.uploadPdf(file).subscribe((pdfUrl) => {
      this.form.patchValue({ pdfUrl });
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    const payload = this.form.value as TemplatePayload;
    if (this.template) {
      this.templateService.update(this.template.id, payload).subscribe((updated) => {
        if (updated) this.saved.emit(updated);
      });
    } else {
      this.templateService.create({ ...payload, pages: [{ num: 1, fields: [] }] }).subscribe((created) => {
        this.saved.emit(created);
      });
    }
  }
}
