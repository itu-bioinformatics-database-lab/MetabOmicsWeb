import { Component, OnInit, Input} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import { AppDataLoader } from '../../../metabol.common/services';
import * as _ from 'lodash';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-search-result',
  templateUrl: 'search-result.component.html',
  styleUrls: ['search-result.component.css'],
})
export class SearchResultComponent implements OnInit {
  query: string;
  filteredMetabolites: Array<any>;
  filteredReactions: Array<any>;
  filteredPathways: Array<any>;

  constructor(private route: ActivatedRoute, private loader: AppDataLoader, private http: HttpClient) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.loader.get('Recon3D', (recon) => {

        const query = params['query'];
        this.query = params['query'];
        const querylower = query.toLowerCase();
        this.filteredReactions = _.values<any>(recon.reactions)
          .filter(x => x.id.startsWith(query) || x.name.startsWith(query) || x.name.toLowerCase().startsWith(querylower) || x.id.toLowerCase().startsWith(querylower) );
        this.filteredPathways = _.keys(recon.pathways)
          .filter(x => x.startsWith(query) || x.toLowerCase().startsWith(querylower));
        
      });

      console.log("query:" , this.query);

      const queryLower = params['query'].toLowerCase();

      this.http.get<any>('assets/datasets/synonyms_latest.json').subscribe((synonym: Record<string, string[]>) => {
        const matchedEntries = Object.entries(synonym)
          .filter(([name, ids]: [string, string[]]) => 
            name.toLowerCase().startsWith(queryLower) || 
            ids.some(id => id.toLowerCase().startsWith(queryLower))
          );

        if (matchedEntries.length > 0) {
          const matchedNames = matchedEntries.map(([name, _]) => name);
          
          const idSet = new Set<string>();
          matchedEntries.forEach(([_, ids]) => {
            (ids as string[]).forEach(id => idSet.add(id));
          });

          const matchedIds = Array.from(idSet);

          this.loader.get('Recon3D', (recon) => {
            this.filteredMetabolites = matchedIds
              .map(id => recon.metabolites[id]) 
              .filter(metabolite => metabolite) 
              .map(metabolite => ({ name: metabolite.name, id: metabolite.id })); 

          });
        } else {
          this.filteredMetabolites = [];
          console.log('No matches found');
        }
      });
    });

  }

}
