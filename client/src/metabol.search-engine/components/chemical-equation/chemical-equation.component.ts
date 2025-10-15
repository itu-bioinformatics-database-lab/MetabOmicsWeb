import { Component, OnChanges, OnInit, Input} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'chemical-equation',
  templateUrl: 'chemical-equation.component.html',
  styleUrls: ['chemical-equation.component.css'],
})
export class ChemicalEquationComponent {
  @Input() metabolites: any[];
  @Input() selectedMetabolite: any;
  reactants: Array<{ id: string, name: string, stoichiometry: number }>;
  products: Array<{ id: string, name: string, stoichiometry: number }>;

  constructor() {
    this.reactants = new Array<{ id: string, name: string, stoichiometry: number }>();
    this.products = new Array<{ id: string, name: string, stoichiometry: number }>();
  }

  // TODO: check if given data is resolved
  ngOnChanges() {
    this.constructor();

    for (let key in this.metabolites) {
      if (this.metabolites[key][0] > 0)
        this.products.push({
          id: this.metabolites[key][1], 
          name: key.replace(/\s*\(.*?\)$/, ''), 
          stoichiometry: this.metabolites[key][0]
        });
      else
        this.reactants.push({
          id: this.metabolites[key][1],
          name: key.replace(/\s*\(.*?\)$/, ''),
          stoichiometry: Math.abs(this.metabolites[key][0])
        });
    }
  }
  

}
