import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TemplateField } from '../../../shared/models/template.model';

@Component({
  selector: 'app-field-properties-panel',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatButtonModule],
  templateUrl: './field-properties-panel.component.html',
  styleUrl: './field-properties-panel.component.scss'
})
export class FieldPropertiesPanelComponent {
  @Input() set field(value: TemplateField | null) {
    this.selected = value;
    if (value) {
      this.form.patchValue(value);
    }
  }
  @Output() update = new EventEmitter<Partial<TemplateField>>();
  selected: TemplateField | null = null;

  readonly fonts = ['standard:roboto', 'standard:arial', 'standard:times'];

  readonly form = this.fb.group({
    mapField: [''],
    fontSize: [14],
    color: ['#111827'],
    fontFamily: ['standard:roboto'],
    backgroundColor: ['#ffffff'],
    opacity: [1],
    locked: [false],
    hidden: [false],
    multiline: [false],
    value: ['']
  });

  constructor(private readonly fb: FormBuilder) {}

  submit(): void {
    if (!this.selected) return;
    this.update.emit({ ...this.form.value } as Partial<TemplateField>);
  }
}
