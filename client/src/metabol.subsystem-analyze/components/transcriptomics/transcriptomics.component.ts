import { Component, OnInit } from '@angular/core';
import { UploadService } from '../../services/upload/upload.service';
import { OmicsSelectionService } from '../../services/omics-selection.service';
@Component({
  selector: 'app-transcriptomics',
  templateUrl: './transcriptomics.component.html',
  styleUrls: ['./transcriptomics.component.css']
})
export class TranscriptomicsComponent implements OnInit {

  constructor(
    public uploadService: UploadService,
    public omicsService: OmicsSelectionService
  ) { }

  ngOnInit() {
    this.omicsService.setCurrentOmicsByType('Transcriptomics');
  }

}