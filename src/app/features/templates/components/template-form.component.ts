import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { PdfTemplate } from '../../../shared/models/template.model';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './template-form.component.html',
  styleUrl: './template-form.component.scss'
})
export class TemplateFormComponent {
  @Input() template?: PdfTemplate;
  @Output() submitTemplate = new EventEmitter<{ name: string; description: string; file?: File }>();

  readonly form: FormGroup;
  pdfFile?: File;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnChanges(): void {
    if (this.template) {
      this.form.patchValue({
        name: this.template.name,
        description: this.template.description
      });
    }
  }

  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.pdfFile = file;
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitTemplate.emit({ ...this.form.value, file: this.pdfFile } as {
      name: string;
      description: string;
      file?: File;
    });
  }
}
