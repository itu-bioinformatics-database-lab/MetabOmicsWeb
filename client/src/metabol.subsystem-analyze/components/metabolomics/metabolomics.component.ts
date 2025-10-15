import { Component, OnInit } from '@angular/core';
import { UploadService } from '../../services/upload/upload.service';
import { OmicsSelectionService } from '../../services/omics-selection.service';

@Component({
  selector: 'app-metabolomics',
  templateUrl: './metabolomics.component.html',
  styleUrls: ['./metabolomics.component.css']
})
export class MetabolomicsComponent implements OnInit {

  constructor(
    public uploadService: UploadService,
    public omicsService: OmicsSelectionService
  ) { }

  ngOnInit() {
    this.omicsService.setCurrentOmicsByType('Metabolomics');
  }

}
