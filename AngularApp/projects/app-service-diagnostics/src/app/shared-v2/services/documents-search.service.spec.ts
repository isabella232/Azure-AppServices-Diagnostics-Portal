import { TestBed } from '@angular/core/testing';

import { DocumentSearchService } from './documents-search.service';

describe('DocumentsSearchService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DocumentSearchService = TestBed.get(DocumentSearchService);
    expect(service).toBeTruthy();
  });
});
