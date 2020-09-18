import { Component, AfterViewInit } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { Globals } from '../../../globals';
import { HttpClient } from '@angular/common/http';
import { ResourceService } from '../../../shared-v2/services/resource.service';

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
  constructor(protected telemetryService: TelemetryService, public globals: Globals, private _http: HttpClient, private resourceService: ResourceService) {
    this.resourceUri = this.resourceService.resourceIdForRouting;
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
    const data: Feedback = {
      comment: comment,
      author: "customer",
      resourceuri: this.resourceUri,
      detectorId: this.globals.getDetectorName(),
      url: window.location.href
    }
    this._http.post(baseUrl, {}, { params: <any>data }).subscribe(res => { });
  }
}

interface Feedback {
  comment: string;
  author: string;
  resourceuri?: string;
  url?: string;
  detectorId?: string
}
