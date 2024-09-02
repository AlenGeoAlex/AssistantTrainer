import { Component, inject, input, OnInit, output } from '@angular/core';
import { IStorageFiles } from '../../../../models/storage-files';
import { StorageConnectionService } from "../../../../services/storage-connection.service";
import { DataViewModule } from 'primeng/dataview';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import {ReviewService} from "../../../../services/review.service";
import {LocalFileService} from "../../../../services/local-file.service";

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
  protected readonly reviewService = inject(ReviewService);
  protected readonly localFileService = inject(LocalFileService);

  protected filesList: IStorageFiles[] = [];
  private blobIterator?: AsyncIterableIterator<IStorageFiles[]>;
  public allDataLoaded = false;

  onSelectFile = output<IStorageFiles>();
  async ngOnInit() {
    await this.refresh()
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
    return Promise.resolve();
  }


  onClickFile(file: IStorageFiles) {
    this.onSelectFile.emit(file);
  }

  onReviewRemove(file: any, $event: any){
    this.reviewService.remove(file.fileName);
    $event.stopPropagation()
    this.messageService.add({ severity: 'info', summary: "Success", detail: 'Reviewed file removed' })
  }


  async addLocalFile(file: IStorageFiles, $event: MouseEvent) {
    try {
      const duplicatedFile = await this.localFileService.addLocal(file, $event);
      if(!duplicatedFile)
        return

      console.log(duplicatedFile);

      this.onClickFile(duplicatedFile);
    }catch (err){
      this.messageService.add({severity: 'error', summary: 'Failed to create', detail: err?.toString() || `An error occurred while duplicating file ${file.id}`, });
    }

  }
}
