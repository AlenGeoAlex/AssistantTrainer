import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import { provideRouter } from "@angular/router";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { routes } from "./app.routes";
import { MessageService } from "primeng/api";
import { NoopAnimationPlayer } from "@angular/animations";
import { provideHttpClient } from "@angular/common/http";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    MessageService,
    importProvidersFrom(BrowserAnimationsModule),
    provideHttpClient(),
  ],
};
