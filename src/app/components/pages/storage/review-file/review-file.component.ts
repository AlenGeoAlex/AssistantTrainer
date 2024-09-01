import { Component, input, inject, OnInit, output } from '@angular/core';
import { StorageConnectionService } from '../../../../services/storage-connection.service';
import { MessageService } from 'primeng/api';
import { IStorageFiles } from '../../../../models/storage-files';
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

@Component({
  selector: 'app-review-file',
  standalone: true,
  imports: [TableModule, CommonModule, ButtonModule, ToggleButtonModule, FormsModule, DialogModule, JSONEditorComponent],
  templateUrl: './review-file.component.html',
  styles: ``
})
export class ReviewFileComponent implements OnInit {

  fileName = input.required<string>();
  private readonly connectionService = inject(StorageConnectionService);
  private readonly messageService = inject(MessageService)
  private dialogService = inject(DialogService);

  onDownloaded = output<void>();

  originalData: { accepted: boolean, uuid: string, tool_calls: { accepted: boolean, uuid: string }[] }[] = [];

  ngOnInit(): void {
    this.connectionService.getBlobByName(this.fileName())?.then(value => {
      console.log(value)
      if (!Array.isArray(value)) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid data received' })
        return;
      }
      value.forEach((v) => {
        this.originalData.push({ ...v, accepted: true, uuid: crypto.randomUUID() })
      })
      this.originalData.forEach((value) => {
        if (value.tool_calls) {
          value.tool_calls.forEach((tool) => {
            tool.accepted = true;
            tool.uuid = crypto.randomUUID();
          })
        }
      })
    }).catch(err => {
      console.log(err)
      this.messageService.add({ severity: 'error', summary: 'Error', detail: String(err) })
    })
  }

  editJSON(index: number) {
    const editingData = this.originalData[index];
    this.dialogService.open(JSONEditorComponent, {
      header: 'Edit JSON',
      data: {
        json: editingData
      }
    }).onClose.subscribe((data: any) => {
      if (!data) return;
      this.originalData[index] = data;
    })
  }

  editCustomJSON(row: any, path: string[]) {
    this.dialogService.open(JSONEditorComponent, {
      header: 'Edit JSON',
      data: {
        json: _get(row, path.join('.'))
      }
    }).onClose.subscribe((data: any) => {
      if (!data) return;
      _set(row, path.join('.'), data);
    })
  }

  addRow(index: number, below = false) {
    this.dialogService.open(JSONEditorComponent, {
      header: 'Add JSON',
      data: {
        json: { role: 'user/assistant', content: '', accepted: true, uuid: crypto.randomUUID() }
      }
    }).onClose.subscribe((data: any) => {
      if (!data) return;
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
      _get(row, path.join('.')).splice(index + (below ? 1 : 0), 0, data);
    })
  }

  completeReview() {
    let filteredData: any = structuredClone(this.originalData);
    filteredData = filteredData.map((value: any) => {
      if (value.tool_calls) {
        value.tool_calls = (value.tool_calls || []).filter((tool: any) => tool.accepted).map((tool: any) => ({ ...tool, accepted: undefined, uuid: undefined }))
      }
      return value;
    }).filter((value: any) => value.accepted).map((value: any) => ({ ...value, accepted: undefined, uuid: undefined }))
    this.dialogService.open(JSONDownloaderComponent, {
      header: 'Download JSON',
      data: {
        json: filteredData,
        fileName: this.fileName().split('/').pop()?.replace('.json', '-reviewed.json')
      }
    }).onClose.subscribe(async (data: any) => {
      if (!data) return;
      const currentFiles = await store.get(StoreKeys.PERSIST_COMPLETED_FILES) || [];
      currentFiles.push(this.fileName());
      store.set(StoreKeys.PERSIST_COMPLETED_FILES, [...new Set(currentFiles)]);
      this.onDownloaded.emit();
    })
  }

}
