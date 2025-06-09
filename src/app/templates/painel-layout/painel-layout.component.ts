import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderPainelComponent } from '../header-painel/header-painel.component';
import { MenuPainelComponent } from '../menu-painel/menu-painel.component';
import { FooterPainelComponent } from '../footer-painel/footer-painel.component';

@Component({
  selector: 'app-painel-layout',
  standalone: true,
  imports: [
    RouterModule,
    HeaderPainelComponent,
    MenuPainelComponent,
    FooterPainelComponent
  ],
  templateUrl: './painel-layout.component.html',
  styleUrls: ['./painel-layout.component.css']
})
export class PainelLayoutComponent {

}
