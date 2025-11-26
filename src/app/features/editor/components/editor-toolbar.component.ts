import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-editor-toolbar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatButtonToggleModule, MatIconModule, MatMenuModule],
  templateUrl: './editor-toolbar.component.html',
  styleUrl: './editor-toolbar.component.scss'
})
export class EditorToolbarComponent {
  @Input() zoom = 1;
  @Input() canUndo = false;
  @Input() canRedo = false;

  @Output() addField = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() zoomChange = new EventEmitter<number>();

  zoomLevels = [0.25, 0.5, 1, 1.5, 2];

  changeZoom(level: number): void {
    this.zoom = level;
    this.zoomChange.emit(level);
  }
}
