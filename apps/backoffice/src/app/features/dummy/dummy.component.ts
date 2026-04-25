import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dummy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <h2>Módulo en construcción</h2>
      <p style="color: #6b7280; margin-top: 1rem;">
        Esta sección estará disponible próximamente.
      </p>
    </div>
  `
})
export class DummyComponent {
}
