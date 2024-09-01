import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import { provideRouter } from "@angular/router";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { routes } from "./app.routes";
import { MessageService } from "primeng/api";
import { provideHttpClient } from "@angular/common/http";
import { DialogService } from 'primeng/dynamicdialog';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    MessageService,
    importProvidersFrom(BrowserAnimationsModule),
    provideHttpClient(),
    DialogService
  ],
};
