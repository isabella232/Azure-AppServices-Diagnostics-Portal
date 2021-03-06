import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { StorageService } from '../../../services/storage.service';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { StorageAccount } from '../../../models/storage';
import { DaasService } from '../../../services/daas.service';
import { SiteService } from '../../../services/site.service';
import { DaasValidationResult } from '../../../models/daas';
import { interval, Subscription } from 'rxjs';
import { ArmService } from '../../../services/arm.service';

@Component({
  selector: 'configure-storage-account',
  templateUrl: './configure-storage-account.component.html',
  styleUrls: ['./configure-storage-account.component.scss']
})
export class ConfigureStorageAccountComponent implements OnInit {

  constructor(private _storageService: StorageService, private _daasService: DaasService, private _siteService: SiteService, private _armService: ArmService) { }

  @Input() siteToBeDiagnosed: SiteDaasInfo;
  @Input() sessionInProgress: boolean;
  @Output() StorageAccountValidated: EventEmitter<DaasValidationResult> = new EventEmitter<DaasValidationResult>();

  Options = [
    { option: 'CreateNew', Text: 'Create new' },
    { option: 'ChooseExisting', Text: 'Choose existing' }
  ];

  chosenOption: any = this.Options[0];
  newStorageAccountName: string = '';
  storageAccounts: StorageAccount[] = [];
  chosenStorageAccount: StorageAccount;
  saveEnabled: boolean = false;
  checkingBlobSasUriConfigured: boolean = true;
  creatingStorageAccount: boolean = false;
  generatingSasUri: boolean = false;
  editMode: boolean = false;
  validationResult: DaasValidationResult = new DaasValidationResult();
  error: any;
  subscriptionOperationStatus: Subscription;
  pollCount: number = 0;

  ngOnInit() {
    this._storageService.getStorageAccounts(this.siteToBeDiagnosed.subscriptionId).subscribe(resp => {
      this.storageAccounts = resp;
      this._daasService.getBlobSasUri(this.siteToBeDiagnosed).subscribe(resp => {
        this.checkingBlobSasUriConfigured = false;
        if (!resp.BlobSasUri) {
          this.setDefaultValues();
        } else {
          this.validationResult.BlobSasUri = resp.BlobSasUri;
          this.validationResult.Validated = true;
          this.StorageAccountValidated.emit(this.validationResult);
        }
      },
        error => {
          this.checkingBlobSasUriConfigured = false;
          this.error = error;
        });
    },
      error => {
        this.checkingBlobSasUriConfigured = false;
        this.error = error;
      });
  }

  setDefaultValues() {
    this.chosenStorageAccount = this.storageAccounts[0];
    this.saveEnabled = true;
    this.newStorageAccountName = this._storageService.getNewStorageAccoutName(this._siteService.currentSiteStatic.name);
  }

  chooseOption(option: any) {
    this.chosenOption = option;
  }

  updateStorageAccount(storageAccount: string) {
    this.newStorageAccountName = storageAccount;
    if (this.newStorageAccountName.length < 4 && this.chosenOption.option === 'CreateNew') {
      this.saveEnabled = false;
    } else {
      this.saveEnabled = true;
    }
  }

  saveChanges() {
    if (this.chosenOption.option === 'ChooseExisting') {
      this.setBlobSasUri(this.chosenStorageAccount.id, this.chosenStorageAccount.name);
    } else {
      this.creatingStorageAccount = true;
      this._storageService.createStorageAccount(this.siteToBeDiagnosed.subscriptionId, this.siteToBeDiagnosed.resourceGroupName, this.newStorageAccountName, this._siteService.currentSiteStatic.location)
        .subscribe(location => {
          this.subscriptionOperationStatus = interval(10000).subscribe(res => {
            this.checkAccountStatus(location);
          });

        },
          error => {
            this.creatingStorageAccount = false;
            this.error = error;
          });
    }

  }

  checkAccountStatus(location: string) {
    this.pollCount++;
    if (this.pollCount > 20) {
      this.creatingStorageAccount = false;
      this.error = "The operation to create the storage account timed out. Please retry after some time or use an existing storage account";
      this.subscriptionOperationStatus.unsubscribe();
      return;
    }
    this._armService.getResourceFullUrl(location, true).subscribe((storageAccount: StorageAccount) => {
      if (storageAccount != null) {
        this.subscriptionOperationStatus.unsubscribe();
        this.creatingStorageAccount = false;
        this.setBlobSasUri(storageAccount.id, storageAccount.name);
      }
    });
  }

  setBlobSasUri(storageAccountId: string, storageAccountName: string) {
    this.generatingSasUri = true;
    this._storageService.getStorageAccountKey(storageAccountId).subscribe(resp => {
      if (resp.keys && resp.keys.length > 0) {
        let storageKey = resp.keys[0].value;
        this._daasService.setBlobSasUri(this.siteToBeDiagnosed, storageAccountName, storageKey).subscribe(resp => {
          if (resp) {
            this._daasService.getBlobSasUri(this.siteToBeDiagnosed).subscribe(resp => {
              this.generatingSasUri = false;
              if (resp.BlobSasUri && resp.BlobSasUri.length > 0) {
                this.validationResult.BlobSasUri = resp.BlobSasUri;
                this.validationResult.Validated = true;
                this.editMode = false;
                this.StorageAccountValidated.emit(this.validationResult);
              }
            },
              error => {
                this.generatingSasUri = false;
                this.error = error;
              });
          } else {
            this.generatingSasUri = false;
            this.error = "Failed to set BlobSasUri for the current app."
          }
        },
          error => {
            this.generatingSasUri = false;
            this.error = "Failed to set BlobSasUri for the current app. " + error;
          });
      }
    },
      error => {
        this.generatingSasUri = false;
        this.error = error;
      });
  }

  getBlobSasUriShort(): string {
    let u = new URL(this.validationResult.BlobSasUri);
    return u.hostname + '/' + u.pathname.replace('/', '');
  }

  getLocations(): string[] {
    let x = this.storageAccounts.map(a => a.location).filter((location, index, arr) => arr.indexOf(location) == index);
    return x;
  }

  getStorageAccountsForLocation(location: string) {
    return this.storageAccounts.filter(x => x.location === location)
  }

  enableEditMode() {
    if (!this.sessionInProgress) {
      this.editMode = true;
      this.setDefaultValues();
      this.validationResult.Validated = false;
      this.StorageAccountValidated.emit(this.validationResult);
    }
  }

  cancel() {
    this.editMode = false;
    this.validationResult.Validated = true;
    this.StorageAccountValidated.emit(this.validationResult);
  }

}