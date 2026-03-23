import { Component, OnInit } from "@angular/core";
import { UploadService } from "../../services/upload/upload.service";
import { OmicsSelectionService } from "../../services/omics-selection.service";
@Component({
  selector: "app-mirnas",
  templateUrl: "./mirnas.component.html",
  styleUrls: ["./mirnas.component.css"],
})
export class MirnaComponent implements OnInit {
  constructor(
    public uploadService: UploadService,
    public omicsService: OmicsSelectionService
  ) {}

  ngOnInit() {
    this.omicsService.setCurrentOmicsByType("miRNA");
  }
}
