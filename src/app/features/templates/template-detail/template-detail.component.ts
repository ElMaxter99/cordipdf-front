import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';

import { TemplateService } from '../../../services/template.service';

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatChipsModule, MatIconModule, RouterLink, AsyncPipe, NgIf, DatePipe],
  templateUrl: './template-detail.component.html',
  styleUrl: './template-detail.component.scss'
})
export class TemplateDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly templateService = inject(TemplateService);

  readonly template$ = this.templateService.getById(this.route.snapshot.params['id']);
}
