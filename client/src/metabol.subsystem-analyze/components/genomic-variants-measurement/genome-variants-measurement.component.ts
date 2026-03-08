import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-genome-variants-measurement",
  templateUrl: "./genome-variants-measurement.component.html",
  styleUrls: ["./genome-variants-measurement.component.css"],
})
export class GenomicVariantsMeasurementComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}
}
