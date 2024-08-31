import {Component, inject, input, OnInit} from '@angular/core';
import { IStorageFiles } from '../../../../models/storage-files';
import {StorageConnectionService} from "../../../../services/storage-connection.service";

@Component({
  selector: 'app-files-list',
  standalone: true,
  imports: [],
  templateUrl: './files-list.component.html',
  styles: ``
})
export class FilesListComponent implements OnInit{

  private readonly connectionService = inject(StorageConnectionService);

  protected readonly filesList : IStorageFiles[] = []

  ngOnInit(): void {
    this.refresh().then(() => {
      console.log(1)
    })
  }

  public async refresh() : Promise<void>{
    if(!this.connectionService.selectedAssistant)
      return Promise.resolve();

    await this.connectionService.getTrainingData(this.connectionService.selectedAssistant.name)
    return Promise.resolve();
  }

}
