import { Component, OnInit, ElementRef, Input} from '@angular/core';
import {Router} from '@angular/router';
import { AppDataLoader } from 'src/metabol.common/services';
import * as _ from 'lodash';
import synonyms from 'src/assets/datasets/synonyms_latest.json';
import { filter } from 'lodash';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'mainsearch-bar',
  templateUrl: 'mainsearch.component.html',
  styleUrls: ['mainsearch.component.css'],
  host: {
    '(document:click)': 'handleClick($event)',
  },
})

export class MainsearchComponent {

  @Input() query: string;
  recon: any;
  filteredMetabolites = [];
  filteredReactions = [];
  filteredPathways = [];
  public synonymList: [] = synonyms;
  filteredSynonyms = [];

  constructor(private router: Router, private elementRef: ElementRef, private loader: AppDataLoader, private http: HttpClient) { }

  search(query: string) {
    if (query)
      this.router.navigate(['/search/search-result', query]);
    this.generateFilters();
  }
  

  getSearch(query: string) {
    if (query)
    {
      const querylower = query.toLowerCase();
      this.loader.get('Recon3D', (recon) => {
        this.filteredReactions = _.values<any>(recon.reactions)
          .filter(x => x.id.startsWith(query) || x.name.startsWith(query) || x.name.toLowerCase().startsWith(querylower) || x.id.toLowerCase().startsWith(querylower));
        this.filteredPathways = _.keys(recon.pathways)
          .filter(x => x.toLowerCase().startsWith(query.toLowerCase()));
      });
      const queryLower = query.toLowerCase();

      this.http.get<any>('assets/datasets/synonyms_latest.json').subscribe((synonym: Record<string, string[]>) => {
        const matchedEntries = Object.entries(synonym)
          .filter(([name, ids]: [string, string[]]) => 
            name.toLowerCase().startsWith(queryLower) || 
            ids.some(id => id.toLowerCase().startsWith(queryLower))
          );

        if (matchedEntries.length > 0) {
          const matchedNames = matchedEntries.map(([name, _]) => name);

          // Collect IDs while ensuring uniqueness
          const idSet = new Set<string>();
          matchedEntries.forEach(([_, ids]) => {
            (ids as string[]).forEach(id => idSet.add(id));
          });

          const matchedIds = Array.from(idSet);

          console.log('Matched Names:', matchedNames);
          console.log('Matched IDs:', matchedIds);

          this.loader.get('Recon3D', (recon) => {
            this.filteredMetabolites = matchedIds
              .map(id => recon.metabolites[id]) 
              .filter(metabolite => metabolite) 
              .map(metabolite => ({ name: metabolite.name, id: metabolite.id })); 

            console.log('Filtered Metabolites:', this.filteredMetabolites);
          });
        } else {
          this.filteredMetabolites = [];
          console.log('No matches found');
        }
      });

    }
  }

  generateFilters() {
    this.filteredReactions = new Array<any>();
    this.filteredMetabolites = new Array<any>();
    this.filteredPathways = new Array<any>();
  }

  /**
   * Closes the autocomplete when click anywhere
   * @param  {[type]} event clickEvent
   */
  handleClick(event) {
    var clickedComponent = event.target;
    var inside = false;
    do {
      if (clickedComponent === this.elementRef.nativeElement)
        inside = true;
      clickedComponent = clickedComponent.parentNode;
    } while (clickedComponent);

    if (!inside) this.generateFilters();
  }

}
