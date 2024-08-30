import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./components/layout/navbar/navbar.component";
import { SidemenuComponent } from "./components/layout/sidemenu/sidemenu.component";
import { TabViewModule } from 'primeng/tabview';
import { StorageComponent } from "./components/pages/storage/storage.component";
import { LocalComponent } from "./components/pages/local/local.component";
import { ToastModule } from 'primeng/toast';
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {LoaderService} from "./services/loader.service";

@Component({
  selector: 'app-root',
  standalone: true,
    imports: [CommonModule, RouterOutlet, NavbarComponent, SidemenuComponent, TabViewModule, StorageComponent, LocalComponent, ToastModule, ProgressSpinnerModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  protected loaderService: LoaderService = inject(LoaderService);

}
