import { Component, OnInit } from '@angular/core';
import { AppDataLoader } from '../../../metabol.common/services';
import * as _ from 'lodash';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subsystem',
  templateUrl: 'subsystem.component.html',
  styleUrls: ['subsystem.component.css'],
})
export class SubsystemComponent implements OnInit {

  subsystems: string[];
  encodeURIComponent = encodeURIComponent;

  constructor(private loader: AppDataLoader, private router: Router) { }

  ngOnInit() {
    this.loader.get('Recon3D', (recon) => {
      this.subsystems = _.keys(recon.pathways);
    });
  }

  loadSubsystem(subsystem: string): void {
    this.router.navigate(['/search/subsystem/detail/', subsystem])
    .then(() => {
      window.location.reload();
    });
  }

}
