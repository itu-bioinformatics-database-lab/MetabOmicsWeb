import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-genomic-variants-measurement",
  templateUrl: "./genomic-variants.component.html",
  styleUrls: ["./genomic-variants.component.css"],
})
export class GenomicVariantsMeasurementComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}
}
