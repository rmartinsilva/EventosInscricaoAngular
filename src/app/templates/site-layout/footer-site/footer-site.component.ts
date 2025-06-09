import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer-site',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer-site.component.html',
  styleUrls: ['./footer-site.component.scss']
})
export class FooterSiteComponent {
  currentYear = new Date().getFullYear();
  logoDesenvolvedorUrl: string = 'assets/images/usinaweb.png'; // Placeholder para sua logo
} 