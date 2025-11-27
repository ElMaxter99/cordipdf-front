import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TemplateService } from '../../services/template.service';
import { Template } from '../../shared/models/template.model';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card class="page-card">
      <button mat-button color="primary" [routerLink]="['/templates']">
        <mat-icon>arrow_back</mat-icon>
        Volver
      </button>
      <h2>{{ isEdit ? 'Editar plantilla' : 'Nueva plantilla' }}</h2>
      <p class="muted">Define el nombre, descripción y sube el PDF base.</p>

      <form [formGroup]="form" class="form" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" required />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Descripción</mat-label>
          <textarea matInput rows="3" formControlName="description"></textarea>
        </mat-form-field>

        <div class="file-input">
          <label>Subir PDF</label>
          <input type="file" accept="application/pdf" (change)="onFileSelected($event)" />
          <p class="muted" *ngIf="uploadedFileName">{{ uploadedFileName }}</p>
        </div>

        <div class="actions">
          <button mat-stroked-button type="button" [routerLink]="['/templates']">Cancelar</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
        </div>
      </form>
    </mat-card>
  `,
  styles: [
    `
      .page-card {
        padding: 1.5rem;
        display: block;
      }
      .form {
        display: grid;
        gap: 1rem;
        margin-top: 1rem;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
      .file-input {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .muted {
        color: var(--mat-sys-on-surface-variant);
      }
    `
  ]
})
export class TemplateFormComponent implements OnInit {
  protected uploadedFileName = '';
  protected isEdit = false;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly templateService = inject(TemplateService);
  private readonly snack = inject(MatSnackBar);

  protected form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    pdfUrl: ['']
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.templateService.getById(id).subscribe((template) => this.form.patchValue(template));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.uploadedFileName = file.name;
      this.templateService.uploadPdf(file).subscribe(({ url }) => this.form.patchValue({ pdfUrl: url }));
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const payload = {
      name: this.form.value.name!,
      description: this.form.value.description!,
      pdfUrl: this.form.value.pdfUrl || '/assets/sample.pdf',
      pages: [{ num: 1, fields: [] }],
      updatedAt: ''
    } satisfies Omit<Template, 'id'>;

    if (this.isEdit) {
      const id = this.route.snapshot.paramMap.get('id')!;
      this.templateService.update(id, payload).subscribe(() => {
        this.snack.open('Plantilla actualizada', 'Cerrar', { duration: 2000 });
        this.router.navigate(['/templates', id]);
      });
    } else {
      this.templateService.create(payload).subscribe((created) => {
        this.snack.open('Plantilla creada', 'Cerrar', { duration: 2000 });
        this.router.navigate(['/editor', created.id]);
      });
    }
  }
}
