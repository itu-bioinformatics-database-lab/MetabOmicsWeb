import { Component, OnInit } from '@angular/core';
import { UploadService } from '../../services/upload/upload.service';
import { OmicsSelectionService } from '../../services/omics-selection.service';
@Component({
  selector: 'app-proteomics',
  templateUrl: './proteomics.component.html',
  styleUrls: ['./proteomics.component.css']
})
export class ProteomicsComponent implements OnInit {

  constructor(
    public uploadService: UploadService,
    public omicsService: OmicsSelectionService
  ) { }

  ngOnInit() {
    this.omicsService.setCurrentOmicsByType('Proteomics');
  }

}

