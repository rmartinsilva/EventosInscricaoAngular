import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header-site',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header-site.component.html',
  styleUrl: './header-site.component.scss'
})
export class HeaderSiteComponent {
  @Input() nomeEvento: string = 'Estancia Recanto de Paz'; // Receberá o nome do evento

  // Poderíamos ter um logo aqui
  logoUrl: string = 'assets/images/logo.png'; // Exemplo
} 