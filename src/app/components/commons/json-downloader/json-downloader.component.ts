import { AfterViewInit, Component, ElementRef, input, ViewChild, inject, Input, OnInit } from '@angular/core';
import * as ace from "ace-builds";
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DialogService, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-json-downloader',
  standalone: true,
  imports: [ButtonModule, InputTextModule, FormsModule],
  templateUrl: './json-downloader.component.html',
  styles: ``
})
export class JSONDownloaderComponent implements AfterViewInit, OnInit {

  @ViewChild("editor") private editor!: ElementRef<HTMLElement>;
  private readonly messageService = inject(MessageService)

  fileName: string = '';
  editedJSON: any;
  returnValue = false;

  constructor(public dialogService: DialogService, private dialogConfig: DynamicDialogConfig, public dialogRef: DynamicDialogRef) { }

  ngOnInit(): void {
    this.fileName = this.dialogConfig.data.fileName;
  }

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

  downloadJSON() {
    const blob = new Blob([this.editedJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.fileName;
    a.click();
    this.returnValue = true;
    this.closeDialog();
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.editedJSON).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Copied to clipboard', detail: 'JSON copied to clipboard' })
      this.returnValue = true;
      this.closeDialog();
    }).catch(err => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to copy to clipboard' })
    })
  }
  closeDialog() {
    this.dialogRef?.close(this.returnValue);
  }

}
