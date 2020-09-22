import { Injectable, Injector } from '@angular/core';
import { Message } from './supportbot/models/message';
import { ActivatedRoute } from '@angular/router';
import { TimePickerInfo } from './fabric-ui/components/detector-time-picker/detector-time-picker.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ResourceService } from './shared-v2/services/resource.service';



@Injectable({ providedIn: 'root' })
export class Globals {
  messages: Message[] = [];
  messagesData: { [id: string]: any } = {};
  set openGeniePanel(value: boolean) {
    //if set openFeedback to true,update messages and open genie
    if (value) {
      // this.updateMsgFromLocalStorage();
    }
    //if set openFeedback to false,save messages and close genie
    else {
      //this.saveMsgToLocalStorage();
    }
    this._openGeniePanel = value;
  };
  get openGeniePanel() {
    return this._openGeniePanel;
  }
  private _openGeniePanel: boolean = false;
  openFeedback: boolean = false;
  openTimePicker: boolean = false;
  openSessionPanel: boolean = false;
  openCreateStorageAccountPanel: boolean = false;
  openCallStackPanel: boolean = false;
  callStackDetails = { managedException: "", callStack: "" };

  private localStorageKey: string = "genieChat";
  public timePickerInfoSub: BehaviorSubject<TimePickerInfo> = new BehaviorSubject<TimePickerInfo>({
    selectedKey: "Last24Hours"
  });

  public feedbackUnreadSub = new BehaviorSubject<number>(0);
  constructor(private activatedRoute: ActivatedRoute, private _http: HttpClient, private resourceService: ResourceService) {
  }

  saveMsgToLocalStorage() {
    const savedMsg = this.messages.map(msg => {
      const copiedMsg = { ...msg };
      if (typeof copiedMsg.component === "function") {
        copiedMsg.component = copiedMsg.component.name;
      }
      return copiedMsg;
    });
    localStorage.setItem(this.localStorageKey, JSON.stringify(savedMsg));
  }

  //get detector or category(for categoryoverview) name for feedback
  getDetectorName(): string {
    const childRoute = this.activatedRoute.firstChild.firstChild.firstChild.firstChild;
    let detectorName = "";

    if (childRoute.firstChild.snapshot.params["detectorName"]) {
      detectorName = childRoute.firstChild.snapshot.params["detectorName"];
    } else {
      detectorName = childRoute.snapshot.params["category"];
    }
    return detectorName;
  }

  updateTimePickerInfo(updatedInfo: TimePickerInfo) {
    this.timePickerInfoSub.next(updatedInfo);
  }

  getFeedbacks() {
    const url = "https://xiaoxu-func.azurewebsites.net/api/GetComments";
    const data = { resourceuri: this.resourceService.resourceIdForRouting };
    return this._http.get<any[]>(url, { params: data });
  }

  getCountUnreadFeedback(feedbacks: any[]) {
    let unread = 0;
    const feedbackFromEng = feedbacks.filter(feedback => feedback.author === "engineer");
    const resourceuri = this.resourceService.resourceIdForRouting;
    let item = JSON.parse(localStorage.getItem("Diag&Solve_Feedback"));
    if (!item || !item[resourceuri]) {
      unread = feedbackFromEng.length;
    } else {
      const lastReadId = item[resourceuri];
      const index = feedbackFromEng.findIndex(feedback => feedback.id === lastReadId);
      unread = feedbackFromEng.length - index - 1;
    }
    this.feedbackUnreadSub.next(unread);
    // return unread;
  }

  initUnreadSub() {
    return this.getFeedbacks().map(feedbacks => {
      this.getCountUnreadFeedback(feedbacks);
    })
  }

  updateLastReadFeedback(feedbacks: any[]) {
    const feedbackFromEng = feedbacks.filter(feedback => feedback.author === "engineer");
    if (feedbackFromEng.length === 0) return;

    let item = JSON.parse(localStorage.getItem("Diag&Solve_Feedback"));
    const resourceuri = this.resourceService.resourceIdForRouting;
    if (!item) {
      item = {};
    }
    item[resourceuri] = feedbackFromEng[feedbackFromEng.length - 1].id;
    localStorage.setItem("Diag&Solve_Feedback", JSON.stringify(item));
    this.feedbackUnreadSub.next(0);
  }
}
