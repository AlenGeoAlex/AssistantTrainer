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
    throw new Error('Method not implemented.');
  }

  public refresh() : Promise<void>{
    return Promise.resolve();
  }

}
