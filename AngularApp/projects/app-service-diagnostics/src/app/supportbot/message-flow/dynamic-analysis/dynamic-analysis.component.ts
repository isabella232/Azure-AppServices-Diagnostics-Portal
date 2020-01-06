import { AfterViewInit, Component, EventEmitter, Injector, OnInit, Output } from '@angular/core';
import { Message, TextMessage, ButtonListMessage } from '../../models/message';
import { ActivatedRoute, Router } from '@angular/router';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { SearchAnalysisMode } from 'projects/diagnostic-data/src/lib/models/search-mode';
import { v4 as uuid } from 'uuid';
import { GenieChatFlow } from '../../../supportbot/message-flow/v2-flows/genie-chat.flow';

@Component({
  selector: 'dynamic-analysis',
  templateUrl: './dynamic-analysis.component.html',
  styleUrls: ['./dynamic-analysis.component.scss']
})
export class DynamicAnalysisComponent implements OnInit, AfterViewInit, IChatMessageComponent {

  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

  loading: boolean = true;
  searchMode: SearchAnalysisMode = SearchAnalysisMode.Genie;

  constructor(private _routerLocal: Router, private _activatedRouteLocal: ActivatedRoute, private injector: Injector, private _genieChatFlow: GenieChatFlow) { }

  keyword: string = "";
  targetedScore: number = 0;
  noSearchResult: boolean = undefined;
  showFeedback: boolean = undefined;
  feedbackText: string = "";
  ngOnInit() {
    this.searchMode = SearchAnalysisMode.Genie;
    this.keyword = this.injector.get('keyword');
    this.targetedScore = this.injector.get('targetedScore');
    console.log("***Dynamic analysis keyword", this.keyword);

   // this._routerLocal.navigate([`../analysis/searchResultsAnalysis/search`], { relativeTo: this._activatedRouteLocal, queryParamsHandling: 'merge', queryParams: {searchTerm: this.keyword} });
  }

  ngAfterViewInit() {
    this.onViewUpdate.emit();
  }

  updateStatus(dataOutput) {
    console.log("status Value before", dataOutput);
      let statusValue = {
        status: dataOutput.status,
        outputData: dataOutput.data,
        data: true
    };

    if (dataOutput.data == undefined || dataOutput.data.detectors == undefined || dataOutput.data.detectors.length === 0)
    {
        this.noSearchResult = true;
    }
    else
    {
        this.noSearchResult = false;
    }

    console.log("status Value", statusValue);
    this._genieChatFlow.createMessageFlowForAnaysisResult(statusValue.outputData, this.noSearchResult);
    this.onComplete.emit(statusValue);

    console.log("****lalalastatus Value", statusValue);
  }

  addHelpfulFeedback() {
    this.feedbackText = 'Great to hear! From 1 to 5 stars, how helpful was this?';
    this.showFeedback = true;
  }

  addNotHelpfulFeedback() {
    this.feedbackText = 'Sorry to hear! Could you let us know how we can improve?';
    this.showFeedback = true;
  }
}

export class DynamicAnalysisMessage extends Message {
    constructor(keyword: string = "", targetedScore: number = 0, messageDelayInMs: number = 1000) {
      super(DynamicAnalysisComponent, {
        keyword: keyword,
        targetedScore: targetedScore,
      }, messageDelayInMs);
    }
}
