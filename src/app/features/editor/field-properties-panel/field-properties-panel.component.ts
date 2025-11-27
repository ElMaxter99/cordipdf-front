import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { NgIf } from '@angular/common';

import { TemplateField } from '../../../core/models/template-field.model';

@Component({
  selector: 'app-field-properties-panel',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatSliderModule,
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './field-properties-panel.component.html',
  styleUrl: './field-properties-panel.component.scss'
})
export class FieldPropertiesPanelComponent {
  @Input() field: TemplateField | null = null;
  @Output() fieldChange = new EventEmitter<TemplateField>();

  readonly fonts = ['standard:roboto', 'serif:times', 'mono:inconsolata'];

  update(partial: Partial<TemplateField>): void {
    if (!this.field) return;
    const updated = { ...this.field, ...partial } as TemplateField;
    this.field = updated;
    this.fieldChange.emit(updated);
  }
}
