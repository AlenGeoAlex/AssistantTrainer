import {Component, input, inject, OnInit, output, InputSignal} from '@angular/core';
import { StorageConnectionService } from '../../../../services/storage-connection.service';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { JSONEditorComponent } from "../../../commons/json-editor/json-editor.component";
import { DialogService } from 'primeng/dynamicdialog';
import { set as _set, get as _get } from 'lodash';
import { JSONDownloaderComponent } from '../../../commons/json-downloader/json-downloader.component';
import { store } from '../../../../store/store';
import { StoreKeys } from '../../../../store/store-keys';
import {AssistantsService} from "../../../../services/assistants.service";
import {ReviewService} from "../../../../services/review.service";

@Component({
  selector: 'app-review-file',
  standalone: true,
  imports: [TableModule, CommonModule, ButtonModule, ToggleButtonModule, FormsModule, DialogModule, JSONEditorComponent],
  templateUrl: './review-file.component.html',
  styles: ``
})
export class ReviewFileComponent implements OnInit {

  fileName = input.required<string>();
  fileBlob: InputSignal<any[] | undefined> = input<any[] | undefined>();
  private readonly connectionService = inject(StorageConnectionService);
  private readonly messageService = inject(MessageService)
  private readonly assistantService = inject(AssistantsService)
  private readonly reviewService = inject(ReviewService)
  private dialogService = inject(DialogService);

  onDownloaded = output<void>();
  onClose = output<void>();
  originalData: { accepted: boolean, uuid: string, tool_calls?: { accepted: boolean, uuid: string }[], [key: string]: any}[] = [];

  async ngOnInit(): Promise<void> {
    const blob = this.fileBlob() ?? await this.connectionService.getBlobByName(this.fileName());
    if(!this.connectionService.selectedAssistant){
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'No assistant selected'})
      this.onClose.emit();
      return;
    }

    try {
      if (!Array.isArray(blob)) {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Invalid data received'})
        this.onClose.emit();
        return;
      }

      const systemPromptKey = StoreKeys.getSystemPromptKey(this.connectionService.selectedAssistant.name)

      let systemPrompt = await store.get(systemPromptKey);
      if(!systemPrompt){
        const asstId = this.connectionService.selectedAssistant.id;
        systemPrompt = await this.assistantService.fetchSystemPrompt(asstId)
        if(systemPrompt){
          await store.set(systemPromptKey, systemPrompt);
        }
      }

      if(systemPrompt){
        this.originalData.push({
          role: "system",
          accepted: true,
          uuid: crypto.randomUUID(),
          content: systemPrompt
        });
      }

      blob.forEach((v) => {
        this.originalData.push({...v, accepted: true, uuid: crypto.randomUUID()})
      })
      this.originalData.forEach((value) => {
        if (value.tool_calls) {
          value.tool_calls.forEach((tool) => {
            tool.accepted = true;
            tool.uuid = crypto.randomUUID();
          })
        }
      })

    }catch (err){
      console.log(err)
      this.messageService.add({ severity: 'error', summary: 'Error', detail: String(err) })
    }
  }

  editJSON(index: number) {
    const editingData = this.originalData[index];
    this.dialogService.open(JSONEditorComponent, {
      header: 'Edit JSON',
      data: {
        json: {
          ...editingData,
          uuid: undefined,
          accepted: undefined,
        },
        isSystemPrompt: editingData["role"] === "system",
      }
    }).onClose.subscribe((data: any) => {
      if (!data) return;
      data["uuid"] = editingData["uuid"];
      data["accepted"] = editingData["accepted"];
      this.originalData[index] = data
    })
  }

  editCustomJSON(row: any, path: string[]) {
    const editingData = _get(row, path.join('.'));
    this.dialogService.open(JSONEditorComponent, {
      header: 'Edit JSON',
      data: {
        json: {
          ...editingData,
          uuid: undefined,
          accepted: undefined,
        }
      }
    }).onClose.subscribe((data: any) => {
      if (!data) return;
      data["uuid"] = editingData["uuid"];
      data["accepted"] = editingData["accepted"];
      _set(row, path.join('.'), data);
    })
  }

  addRow(index: number, below = false) {
    this.dialogService.open(JSONEditorComponent, {
      header: 'Add JSON',
      data: {
        json: { role: 'user/assistant', content: '' }
      }
    }).onClose.subscribe((data: any) => {
      if (!data) return;
      data["uuid"] = crypto.randomUUID();
      data["accepted"] = true;
      this.originalData.splice(index + (below ? 1 : 0), 0, data);
    })
  }

  addCustomRow(row: any, path: string[], index: number, below = false) {
    this.dialogService.open(JSONEditorComponent, {
      header: 'Add JSON',
      data: {
        json: {
          id: "",
          type: "function",
          function: {
            name: "",
            arguments: "{}"
          },
          accepted: true,
          uuid: crypto.randomUUID()
        }
      }
    }).onClose.subscribe((data: any) => {
      if (!data) return;
      data["uuid"] = crypto.randomUUID();
      data["accepted"] = true;
      _get(row, path.join('.')).splice(index + (below ? 1 : 0), 0, data);
    })
  }

  completeReview() {
    const filteredData = this.filterSubmission();
    this.dialogService.open(JSONDownloaderComponent, {
      header: 'Download JSON',
      data: {
        json: filteredData,
        fileName: this.fileName().split('/').pop()?.replace('.json', '-reviewed.json')
      }
    }).onClose.subscribe(async (data: any) => {
      if (!data) return;
      this.onDownloaded.emit();
    })
  }

  markReviewed(){
    const filteredData = this.filterSubmission();
    const fileName = this.fileName().split('/').pop()!;
    this.reviewService.review(fileName, filteredData);
    this.messageService.add({ severity: 'info', summary: 'Marked', detail: "Marked as reviewed" })
    this.onClose.emit()
  }

  private filterSubmission() : any{
    let filteredData: any = structuredClone(this.originalData);
    filteredData = filteredData.map((value: any) => {
      if (value.tool_calls) {
        value.tool_calls = (value.tool_calls || []).filter((tool: any) => tool.accepted).map((tool: any) => ({ ...tool, accepted: undefined, uuid: undefined }))
      }
      return value;
    }).filter((value: any) => value.accepted).map((value: any) => ({ ...value, accepted: undefined, uuid: undefined }))
    return filteredData;
  }


}
