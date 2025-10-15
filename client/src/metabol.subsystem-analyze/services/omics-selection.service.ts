import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface OmicsData {
  type: string;
  fileUploaded?: boolean;
  data?: any;
  fileName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OmicsSelectionService {
  private selectedOmicsSubject = new BehaviorSubject<OmicsData[]>([]);
  private currentOmicsIndexSubject = new BehaviorSubject<number>(0);

  selectedOmics$ = this.selectedOmicsSubject.asObservable();
  currentOmicsIndex$ = this.currentOmicsIndexSubject.asObservable();
  
  // Computed observable for current omics
  get currentOmics$(): Observable<OmicsData | null> {
    return new Observable(observer => {
      const subscription = this.selectedOmics$.subscribe(omics => {
        const currentIndex = this.currentOmicsIndexSubject.value;
        if (omics && omics.length > 0 && currentIndex >= 0 && currentIndex < omics.length) {
          observer.next(omics[currentIndex]);
        } else {
          observer.next(null);
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  constructor() {}

  setSelectedOmics(omicsTypes: string[]): void {
    // Remove duplicates while preserving order
    const uniqueTypes = omicsTypes.filter((type, index) => omicsTypes.indexOf(type) === index);
    
    // Define a consistent global order for known omics types
    const orderMap: { [key: string]: number } = {
      "Metabolomics": 0,
      "Transcriptomics": 1,
      "Proteomics": 2,
      "Genomic Variants": 3,
      "Epigenomics": 4,
      "miRNA": 5
    };

    // Create array of omics data sorted by predefined order
    const omicsArray: OmicsData[] = uniqueTypes
      .sort((a, b) => {
        const aOrder = orderMap[a] !== undefined ? orderMap[a] : Number.MAX_SAFE_INTEGER;
        const bOrder = orderMap[b] !== undefined ? orderMap[b] : Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
      })
      .map(type => ({
        type,
        fileUploaded: false
      }));

    this.selectedOmicsSubject.next(omicsArray);
    this.currentOmicsIndexSubject.next(0);
  }

  setCurrentOmics(index: number): void {
    const selectedOmics = this.selectedOmicsSubject.value;
    if (index >= 0 && index < selectedOmics.length) {
      this.currentOmicsIndexSubject.next(index);
    }
  }

  setCurrentOmicsByType(type: string): void {
    const selectedOmics = this.selectedOmicsSubject.value;
    const index = selectedOmics.findIndex(o => o.type === type);
    if (index !== -1) {
      this.currentOmicsIndexSubject.next(index);
    }
  }

  updateOmicsData(type: string, data: { fileName: string; data?: any }): void {
    const selectedOmics = this.selectedOmicsSubject.value;
    const index = selectedOmics.findIndex(o => o.type === type);
    
    if (index !== -1) {
      const updatedOmics = selectedOmics.slice();
      updatedOmics[index] = Object.assign({}, updatedOmics[index], { 
        fileUploaded: true, 
        ...data 
      });
      this.selectedOmicsSubject.next(updatedOmics);
    }
  }

  getSelectedOmicsArray(): OmicsData[] {
    return this.selectedOmicsSubject.value;
  }

  getCurrentOmics(): OmicsData | null {
    const selectedOmics = this.selectedOmicsSubject.value;
    const currentIndex = this.currentOmicsIndexSubject.value;
    
    if (selectedOmics && selectedOmics.length > 0 && currentIndex >= 0 && currentIndex < selectedOmics.length) {
      return selectedOmics[currentIndex];
    }
    return null;
  }

  getCurrentOmicsIndex(): number {
    return this.currentOmicsIndexSubject.value;
  }

  hasUploadedAllFiles(): boolean {
    const selectedOmics = this.selectedOmicsSubject.value;
    return selectedOmics.length > 0 && selectedOmics.every(omics => omics.fileUploaded);
  }
} 