import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderSiteComponent } from './header-site/header-site.component';
import { FooterSiteComponent } from './footer-site/footer-site.component';

@Component({
  selector: 'app-site-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderSiteComponent, FooterSiteComponent],
  templateUrl: './site-layout.component.html',
  styleUrl: './site-layout.component.scss'
})
export class SiteLayoutComponent {

} 