import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transcriptomics-measurement',
  templateUrl: './transcriptomics-measurement.component.html',
  styleUrls: ['./transcriptomics-measurement.component.css']
})
export class TranscriptomicsMeasurementComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
  }
} 