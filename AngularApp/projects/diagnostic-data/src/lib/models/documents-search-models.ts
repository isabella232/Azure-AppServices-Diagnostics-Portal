export class Query {
    searchId : string; 
    searchTerm : string;
    productName : string ;
    documentType : string ;
    documentSource : string[];
    numberOfDocuments : number;    
}

export class Document{
    title : string ;
    url : string ;
    score : number;
    description : string ;
    documentType : string;
    documentSource : string
}