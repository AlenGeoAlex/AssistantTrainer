import { AfterViewInit, Component, ElementRef, input, ViewChild, inject } from '@angular/core';
import * as ace from "ace-builds";
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DialogService, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-json-editor',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './json-editor.component.html',
  styles: ``
})
export class JSONEditorComponent implements AfterViewInit {
  @ViewChild("editor") private editor!: ElementRef<HTMLElement>;
  private readonly messageService = inject(MessageService)

  // initialJSON = input.required<Record<any, any>>();

  editedJSON: any;

  constructor(public dialogService: DialogService, private dialogConfig: DynamicDialogConfig, public dialogRef: DynamicDialogRef) { }

  ngAfterViewInit(): void {
    this.editedJSON = JSON.stringify(this.dialogConfig.data.json, null, 2);
    ace.config.set("fontSize", "16px");
    ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.4.12/src-noconflict');
    const aceEditor = ace.edit(this.editor.nativeElement);
    aceEditor.session.setValue(JSON.stringify(this.dialogConfig.data.json, null, 2));
    aceEditor.getSession().setMode("ace/mode/json");
    aceEditor.setTheme("ace/theme/twilight");
    aceEditor.getSession().setTabSize(2);
    aceEditor.getSession().setUseWrapMode(true);
    aceEditor.on("change", () => {
      this.editedJSON = aceEditor.getValue();
    });
  }

  checkAndClose() {
    try {
      const parsed = JSON.parse(this.editedJSON);
      this.dialogRef?.close(parsed);
    } catch (err) {
      this.messageService.add({ severity: 'error', summary: 'Invalid JSON', detail: 'Please correct the JSON and try again' })
    }
  }
}
