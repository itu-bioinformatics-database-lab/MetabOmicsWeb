import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Compiler } from '@angular/core';


import { Router } from '@angular/router';

import { AppDataLoader } from '../../../metabol.common/services';
import * as _ from 'lodash';
import { any } from 'codelyzer/util/function';
import { ReadVarExpr } from '@angular/compiler';

@Component({
  selector: 'app-subsystem-detail',
  templateUrl: 'subsystem-detail.component.html',
  styleUrls: ['subsystem-detail.component.css'],
})
export class SubsystemDetailComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private loader: AppDataLoader,
    private router: Router,
    private _compiler: Compiler
        ) { }

  pathway: string;
  reactions: any[];
  connectedSubsystems: string[];
  reaction_metabolites: Map<any, any[]> = new Map;

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.pathway = decodeURIComponent(params['id']);
      this.loader.get('Recon3D', (recon) => {
      this.reactions = recon.pathways[this.pathway].map(x => recon.reactions[x]);
      for (let reaction of this.reactions) {
        let updatedMetabolites: { [id: string]: any } = {};
        for (let metabolite of Object.keys(reaction.metabolites)) {
          let metabolite_synonym = recon.metabolites[metabolite].name;
          let uniqueKey = `${metabolite_synonym} (${metabolite})`; 
          updatedMetabolites[uniqueKey] = [reaction.metabolites[metabolite], metabolite];
        }
        reaction.metabolites = updatedMetabolites;
      }
      });
    });
  }
}
