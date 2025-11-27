import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';

import { TemplateService } from '../../../services/template.service';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatIconModule,
    NgIf
  ],
  templateUrl: './template-form.component.html',
  styleUrl: './template-form.component.scss'
})
export class TemplateFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly templateService = inject(TemplateService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    pages: [1, Validators.required],
    pdf: [null as File | null]
  });

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.form.patchValue({ pdf: input.files[0] });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const { pdf, ...values } = this.form.value;
    if (pdf) {
      this.templateService.uploadPdf(pdf).subscribe((pdfUrl) => {
        this.createTemplate({ ...values, pdfUrl });
      });
    } else {
      this.createTemplate(values);
    }
  }

  private createTemplate(values: any): void {
    this.templateService.create(values).subscribe((created) => {
      this.router.navigate(['/editor', created.id]);
    });
  }
}
