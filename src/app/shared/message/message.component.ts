import { Component, Input } from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [MessageModule],
  template: `
    @if (showMessage()) {
      <div>
        <p-message 
          [severity]="severity" 
          [text]="text"
          [style]="{'margin-top': '4px', 'margin-bottom': '0.5rem'}"
        ></p-message>
        
        @if (hasErrors()) {
          <ul class="list-none pl-4 mt-2">
            @for (field of errorFields; track field) {
              @for (error of errors![field]; track error) {
                <li class="text-red-500 mb-1">
                  • {{ error }}
                </li>
              }
            }
          </ul>
        }
      </div>
    }
  `,
  styles: [`
    :host ::ng-deep .p-message {
      width: 100%;
    }
    :host ::ng-deep .p-message .p-message-wrapper {
      padding: 0.5rem;
    }
  `]
})
export class MessageComponent {
  @Input() control?: AbstractControl | FormControl | FormGroup | null;
  @Input() text: string = '';
  @Input() error: string = '';
  @Input() severity: 'error' | 'warn' | 'info' | 'success' = 'error';
  @Input() showAlways: boolean = false;
  @Input() errors: { [key: string]: string[] } | undefined;

  get errorFields(): string[] {
    return this.errors ? Object.keys(this.errors) : [];
  }

  hasErrors(): boolean {
    return this.errors !== undefined && this.errorFields.length > 0;
  }

  showMessage(): boolean {
    if (this.showAlways) {
      return true;
    }
    
    if (!this.control) return false;
    
    const hasError = this.control.hasError(this.error);
    const isDirty = this.control.dirty;
    const isTouched = this.control.touched;
    
    return hasError && (isDirty || isTouched);
  }
}
