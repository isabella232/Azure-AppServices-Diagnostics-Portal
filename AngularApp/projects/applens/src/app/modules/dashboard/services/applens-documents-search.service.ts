import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http"
import { Observable } from 'rxjs';
import { Query, Document } from 'diagnostic-data';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';

@Injectable({
  providedIn:"root"
})
export class ApplensDocumentsSearchService {
  private authKey: string = "";
  private url : string = "";
  httpOptions = {}

  constructor(  private http: HttpClient,
                private _backendApi : DiagnosticApiService 
              ) { 
    this._backendApi.get<string>(`api/appsettings/DeepSearch:Endpoint`).subscribe((value: string) =>{
      this.url = value;
    });

    this._backendApi.get<string>(`api/appsettings/DeepSearch:AuthKey`).subscribe((value: string) =>{
      this.authKey = value;
      this.httpOptions = {
        headers: new HttpHeaders({
          "Content-Type" : "application/json",
          "authKey" : this.authKey
        })
      };
    });
    
  }

  public IsEnabled() : Observable<boolean> {
    return this._backendApi.get<string>(`api/appsettings/DeepSearch:isEnabled`)
                            // Value in App Service Application Settings are returned as strings 
                            // converting this to boolean
                            .map(status =>  ( status.toLowerCase() == "true") );    
                            
  }

  private constructUrl(query: Query) : string{
    let  queryString = Object.keys(query).map(key => {
      if(typeof (query[key] ) === "object" ){
        return query[key].map( value => {
          if (value != "")
            return key + "=" + value
          }).join("&");
      }
      else
        return key + '=' + query[key]
    }).join("&");
    
    return queryString;
  }

  public Search(query): Observable<Document[]> {   
    let queryString = this.constructUrl(query);
    let url = this.url  + "?" +queryString;
    return this.http.get<Document[]>(url, this.httpOptions)
                  
  }

}
