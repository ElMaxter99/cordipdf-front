import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe, NgFor, NgIf } from '@angular/common';

import { TemplateService } from '../../../services/template.service';
import { Template } from '../../../core/models/template.model';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    RouterLink,
    NgFor,
    NgIf,
    DatePipe
  ],
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.scss'
})
export class TemplateListComponent {
  readonly templateService = inject(TemplateService);
  readonly displayedColumns = ['name', 'description', 'updatedAt', 'actions'];

  delete(template: Template): void {
    this.templateService.delete(template.id).subscribe();
  }
}
