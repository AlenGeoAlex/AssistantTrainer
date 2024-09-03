import { AfterViewInit, Component, ElementRef, input, ViewChild, inject } from '@angular/core';
import * as ace from "ace-builds";
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DialogService, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import {StorageConnectionService} from "../../../services/storage-connection.service";
import {AssistantsService} from "../../../services/assistants.service";
import {addWarning} from "@angular-devkit/build-angular/src/utils/webpack-diagnostics";
import {store} from "../../../store/store";
import {StoreKeys} from "../../../store/store-keys";

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
  private readonly connectionService = inject(StorageConnectionService)
  private readonly assistantsService = inject(AssistantsService)

  // initialJSON = input.required<Record<any, any>>();

  editedJSON: any;
  isSystemPrompt: boolean = false;
  aceEditor?: ace.Ace.Editor;

  constructor(public dialogService: DialogService, private dialogConfig: DynamicDialogConfig, public dialogRef: DynamicDialogRef) { }

  ngAfterViewInit(): void {
    this.editedJSON = JSON.stringify(this.dialogConfig.data.json, null, 2);
    this.isSystemPrompt = this.dialogConfig.data.isSystemPrompt ?? false;
    ace.config.set("fontSize", "16px");
    ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.4.12/src-noconflict');
    this.aceEditor = ace.edit(this.editor.nativeElement);
    this.aceEditor.session.setValue(JSON.stringify(this.dialogConfig.data.json, null, 2));
    this.aceEditor.getSession().setMode("ace/mode/json");
    this.aceEditor.setTheme("ace/theme/twilight");
    this.aceEditor.getSession().setTabSize(2);
    this.aceEditor.getSession().setUseWrapMode(true);
    this.aceEditor.on("change", () => {
      if(!this.aceEditor)
        return;

      this.editedJSON = this.aceEditor.getValue();
    });
  }

  checkAndClose() {
    try {
      const parsed = JSON.parse(this.editedJSON);
      if(this.isSystemPrompt && this.connectionService.selectedAssistant){
        store.set(StoreKeys.getSystemPromptKey(this.connectionService.selectedAssistant.name), parsed.content || '').then(() => {
          this.messageService.add({ severity: 'info', summary: 'Updated System Prompt', detail: 'System prompt has been updated and will be reflected for newer reviews' })
        })
      }
      this.dialogRef?.close(parsed);
    } catch (err) {
      this.messageService.add({ severity: 'error', summary: 'Invalid JSON', detail: 'Please correct the JSON and try again' })
    }
  }

  async refreshSystemPrompt(){
    if(!this.connectionService.selectedAssistant){
      this.messageService.add({ severity: 'error', summary: 'Invalid Assistant', detail: 'Please select an assistant' })
      return;
    }

    if(!this.aceEditor){
      this.messageService.add({ severity: 'error', summary: 'Invalid Assistant', detail: 'An unknown error occurred while refreshing the editor' })
      return
    }

    const systemPrompt = await this.assistantsService.fetchSystemPrompt(this.connectionService.selectedAssistant.id);
    if(!systemPrompt){
      this.messageService.add({ severity: 'info', summary: 'Prompt Refresh', detail: 'No system prompt has been specified' })
      return
    }

    const temp = JSON.parse(this.editedJSON || JSON.stringify(this.dialogConfig.data.json, null, 2))
    temp.content = systemPrompt;
    this.editedJSON = JSON.stringify(temp, null, 2);
    this.aceEditor.setValue(JSON.stringify(temp, null, 2));
    this.messageService.add({ severity: 'info', summary: 'Prompt Refresh', detail: 'System prompt has been refreshed' })
  }
}
