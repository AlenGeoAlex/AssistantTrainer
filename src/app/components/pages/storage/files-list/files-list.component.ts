import { Component, inject, input, OnInit, output } from '@angular/core';
import { IStorageFiles } from '../../../../models/storage-files';
import { StorageConnectionService } from "../../../../services/storage-connection.service";
import { DataViewModule } from 'primeng/dataview';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { store } from '../../../../store/store';
import { StoreKeys } from '../../../../store/store-keys';

@Component({
  selector: 'app-files-list',
  standalone: true,
  imports: [DataViewModule, CommonModule, ButtonModule],
  templateUrl: './files-list.component.html',
  styles: ``
})
export class FilesListComponent implements OnInit {

  private readonly connectionService = inject(StorageConnectionService);
  private readonly messageService = inject(MessageService)

  protected filesList: IStorageFiles[] = [];
  private blobIterator?: AsyncIterableIterator<IStorageFiles[]>;
  public allDataLoaded = false;

  onSelectFile = output<IStorageFiles>();

  completedFiles: string[] = [];

  async ngOnInit() {
    this.refresh()
  }

  updateData() {
    return this.blobIterator?.next().then(async value => {
      if (value.done) {
        this.allDataLoaded = true;
      }
      if (!value.value) {
        this.messageService.add({ severity: 'warn', summary: 'All files loaded', detail: 'No more data to load' })
        return;
      }
      this.filesList = [...this.filesList, ...value.value];
      console.log(value)
      // this.connectionService.getBloByName(this.filesList[0].fileName)?.download().then(async value => {
      //   console.log(await (await value.blobBody)?.text()) 
      // })
      if (value.done) {
        this.allDataLoaded = true;
        return;
      }
    })
  }

  public async refresh(): Promise<void> {
    if (!this.connectionService.selectedAssistant)
      return Promise.resolve();
    this.filesList = [];
    this.blobIterator = this.connectionService.getTrainingData(this.connectionService.selectedAssistant.name);
    await this.updateData();
    this.completedFiles = await store.get(StoreKeys.PERSIST_COMPLETED_FILES) || [];
    return Promise.resolve();
  }


  onClickFile(file: IStorageFiles) {
    this.onSelectFile.emit(file);
  }


}
