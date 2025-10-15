import { Component, OnInit } from '@angular/core';
import { UploadService } from '../../services/upload/upload.service';
import { OmicsSelectionService } from '../../services/omics-selection.service';
@Component({
  selector: 'app-mirna',
  templateUrl: './mirna.component.html',
  styleUrls: ['./mirna.component.css']
})
export class MirnaComponent implements OnInit {

  constructor(
    public uploadService: UploadService,
    public omicsService: OmicsSelectionService
  ) { }

  ngOnInit() {
    this.omicsService.setCurrentOmicsByType('miRNA');
  }

}

