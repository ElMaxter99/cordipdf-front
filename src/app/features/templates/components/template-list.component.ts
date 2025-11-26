import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { TemplateService } from '../../../services/template.service';
import { PdfTemplate } from '../../../shared/models/template.model';
import { TemplateFormComponent } from './template-form.component';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    NgFor,
    NgIf,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    TemplateFormComponent
  ],
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.scss'
})
export class TemplateListComponent {
  readonly templates$ = this.templateService.getAll();
  readonly showForm = signal(false);

  constructor(private readonly templateService: TemplateService) {}

  toggleForm(): void {
    this.showForm.set(!this.showForm());
  }

  handleCreate(data: { name: string; description: string; file?: File }): void {
    const { file, ...rest } = data;
    if (file) {
      this.templateService.uploadPdf(file).subscribe((pdfUrl) => {
        this.templateService.create({ ...rest, pdfUrl }).subscribe(() => this.showForm.set(false));
      });
      return;
    }
    this.templateService.create(rest).subscribe(() => this.showForm.set(false));
  }

  delete(template: PdfTemplate, event: MouseEvent): void {
    event.stopPropagation();
    this.templateService.delete(template.id).subscribe();
  }
}
