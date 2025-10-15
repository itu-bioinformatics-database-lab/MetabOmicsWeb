import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mirna-measurement',
  templateUrl: './mirna-measurement.component.html',
  styleUrls: ['./mirna-measurement.component.css']
})
export class MirnaMeasurementComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
  }
}

