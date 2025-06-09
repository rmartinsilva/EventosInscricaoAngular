import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AsyncPipe, NgIf } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header-painel',
  standalone: true,
  imports: [AsyncPipe, NgIf],
  templateUrl: './header-painel.component.html',
  styleUrl: './header-painel.component.css'
})
export class HeaderPainelComponent {
  private authService = inject(AuthService);
  userName$: Observable<string | null> = this.authService.userName$;

  // TODO: Adicionar método para logout se necessário no header
}
