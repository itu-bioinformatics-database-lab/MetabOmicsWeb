import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import { AppDataLoader } from '../../../metabol.common/services';
import {ReactionVisualizationComponent} from '../../../metabol.visualization/components'
import * as _ from 'lodash';

@Component({
  selector: 'app-reaction-details',
  templateUrl: 'reaction-details.component.html',
  styleUrls: ['reaction-details.component.css'],
})
export class ReactionDetailsComponent implements OnInit {

  reaction;
  relatedMetabolites;


  constructor(private route: ActivatedRoute, private loader: AppDataLoader) { }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.loader.get("Recon3D", (recon) => {
        this.reaction = recon.reactions[params['id']];
        this.relatedMetabolites = _.keys(this.reaction.metabolites).map(x => recon.metabolites[x]);

        let updatedMetabolites: { [id: string]: any } = {};
        for (let metabolite of Object.keys(this.reaction.metabolites)) {
          let metabolite_synonym = recon.metabolites[metabolite].name;
          let uniqueKey = `${metabolite_synonym} (${metabolite})`; 
          updatedMetabolites[uniqueKey] = [this.reaction.metabolites[metabolite], metabolite];
        }
        this.reaction.metabolites = updatedMetabolites;        
      });
    });
  }

}
