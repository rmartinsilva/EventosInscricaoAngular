import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SpinnerService } from './spinner.service';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    <div *ngIf="spinnerService.isLoading$ | async" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <p-progressSpinner 
        styleClass="w-12 h-12" 
        strokeWidth="4" 
        fill="var(--surface-ground)" 
        animationDuration=".5s">
      </p-progressSpinner>
    </div>
  `
})
export class SpinnerComponent {
  constructor(@Inject(SpinnerService) public spinnerService: SpinnerService) {}
}
