import { Component, AfterViewInit } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import { TelemetryService, TelemetryEventNames, ResourceDescriptor } from 'diagnostic-data';
import { Globals } from '../../../globals';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'fabric-feedback',
  templateUrl: './fabric-feedback.component.html',
  styleUrls: ['./fabric-feedback.component.scss']
})
export class FabricFeedbackComponent implements AfterViewInit {
  type: PanelType = PanelType.custom;
  // dismissSubject: Subject<void> = new Subject<void>();
  ratingEventProperties: any;
  feedbackText: string = "";
  feedbackIcons: { id: string, text: string }[] =
    [
      {
        id: "EmojiDisappointed",
        text: "very dissatisfied"
      },
      {
        id: "Sad",
        text: "dissatisfied "
      },
      {
        id: "EmojiNeutral",
        text: "ok"
      },
      {
        id: "Emoji2",
        text: "satisfied"
      },
      {
        id: "Emoji",
        text: "very satisfied"
      }
    ];
  submitted: boolean = false;
  rating: number = 0;
  feedbacks: Feedback[] = [];
  resourceUri: string = "";
  constructor(protected telemetryService: TelemetryService, public globals: Globals, private _http: HttpClient, private router: ActivatedRoute) {
    // const resource = ResourceDescriptor.parseResourceUri(window.location.href);
    const subscriptionid = this.router.snapshot.params["subscriptionid"];
    const resourcegroup = this.router.snapshot.params["resourcegroup"];
    const resourcename = this.router.snapshot.params["resourcename"];
    this.resourceUri = `/subscriptions/${subscriptionid}/resourceGroups/${resourcegroup}/providers/Microsoft.Web/sites/${resourcename}`;
    this.resourceUri = this.resourceUri.toLowerCase();
    this.getFeedbacks().subscribe(feedbacks => {
      this.feedbacks = feedbacks;
    })
  }

  submitFeedback() {
    const eventProps = {
      Rating: String(this.rating),
      Feedback: this.feedbackText
    };
    const detectorName = this.globals.getDetectorName();
    this.ratingEventProperties = {
      'DetectorId': detectorName,
      'Url': window.location.href
    };
    this.logEvent(TelemetryEventNames.StarRatingSubmitted, eventProps);
    this.addFeedback(this.feedbackText);
    this.submitted = true;
  }

  setRating(index: number) {
    this.rating = index + 1;
  }

  protected logEvent(eventMessage: string, eventProperties?: any, measurements?: any) {
    for (const id of Object.keys(this.ratingEventProperties)) {
      if (this.ratingEventProperties.hasOwnProperty(id)) {
        eventProperties[id] = String(this.ratingEventProperties[id]);
      }
    }
    this.telemetryService.logEvent(eventMessage, eventProperties, measurements);
  }

  openGenieHandler() {
    this.globals.openFeedback = false;
    this.globals.openGeniePanel = true;
  }

  ngOnInit() {
    this.reset();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const eles = document.querySelectorAll("#feedback-icons i");
      if (eles && eles.length > 0) {
        eles.forEach((ele, index) => {
          ele.setAttribute("role", "button");
          ele.setAttribute("name", this.feedbackIcons[index].text);
        });
      }
    });
  }

  reset() {
    this.rating = 0;
    this.feedbackText = "";
    this.submitted = false;
  }


  dismissedHandler() {
    this.globals.openFeedback = false;
    this.reset();
  }

  getFeedbacks() {
    const url = "https://xiaoxu-func.azurewebsites.net/api/GetComments";
    const data = { resourceuri: this.resourceUri };
    return this._http.get<Feedback[]>(url, { params: data });
  }

  addFeedback(comment: string) {
    if (comment === "") return;

    const baseUrl = "https://xiaoxu-func.azurewebsites.net/api/AddComment";
    let resourceuri = "/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourceGroups/Default-Web-WestUS/providers/Microsoft.Web/sites/addingeventlogs";
    resourceuri.toLowerCase();
    const data = {
      comment: comment,
      author: "customer",
      resourceuri: this.resourceUri
    }
    this._http.post(baseUrl, {}, { params: data }).subscribe(res => { });
  }
}

interface Feedback {
  comment: string;
  author: string;
  resourceuri?: string;
}
