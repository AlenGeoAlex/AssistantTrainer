import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";
import { Buffer } from 'buffer';

// (window as any).Buffer = Buffer;
bootstrapApplication(AppComponent, appConfig)
    .then(() => {
        disableMenu();
    })
    .catch((err) =>
  console.error(err),
);

function disableMenu() {
    if (window.location.hostname !== 'tauri.localhost') {
        return
    }

    document.addEventListener('contextmenu', e => {
        e.preventDefault();
        return false;
    }, { capture: true })
}
