import { Routes } from '@angular/router';

import { TemplateListComponent } from './features/templates/template-list/template-list.component';
import { TemplateFormComponent } from './features/templates/template-form/template-form.component';
import { TemplateDetailComponent } from './features/templates/template-detail/template-detail.component';
import { EditorPageComponent } from './features/editor/editor-page/editor-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'templates' },
  { path: 'templates', component: TemplateListComponent },
  { path: 'templates/new', component: TemplateFormComponent },
  { path: 'templates/:id', component: TemplateDetailComponent },
  { path: 'editor/:id', component: EditorPageComponent }
];
