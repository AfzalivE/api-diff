/* eslint-disable no-console */

import md5 from 'md5';
import { Change } from '../change';
import { CompareFormatter, FinishedStats, makeResponseTimesHistogram } from './compare-formatter';

/** One half of a compare response in output */
type ApiEnvResponse = {
  response: unknown;
  url: string;
  status: number;
};
/** One compare output entry in json */
export type JsonChange = {
  id: string;
  old: ApiEnvResponse;
  new?: ApiEnvResponse;
} & Pick<Change, 'delta' | 'query'>;

/** Outputs compare run as json. HTML output is built on top of this format */
export default class JsonFormatter extends CompareFormatter {
  numQueriesRun = 0;

  numQueriesChanged = 0;

  changes: JsonChange[] = [];

  queryCompleted(change: Change): void {
    this.numQueriesRun += 1;
    if (this.numQueriesRun % 10 === 0) {
      console.error(`IN PROGRESS. ${this.numQueriesRun}/${this.totalQueries} run`);
    }

    if (!change.delta && this.showUnchanged) {
      return;
    }
    this.numQueriesChanged += 1;

    this.changes.push({
      id: md5(JSON.stringify({ delta: change.delta, params: change.query.params })),
      query: change.query,
      delta: change.delta,
      old: {
        response: change.oldResponse.data,
        status: change.oldResponse.status,
        url: change.oldResponse.request?.res?.responseUrl,
      },
      new: change.newResponse?.data
        ? {
          response: change.newResponse.data,
          status: change.newResponse.status,
          url: change.newResponse.request.res.responseUrl,
        }
        : undefined,
    });
  }

  /**
   * Output the overall json object. Broken out here so html formatter can call it
   *
   * @param {FinishedStats} finishedStats new/old stats - status codes, response times, more to come
   * @returns {unknown} top level json object
   */
  finishedDict(finishedStats: FinishedStats): unknown {
    return {
      startTime: this.startDate.toISOString(),
      endTime: new Date().toISOString(),
      command: process.argv.join(' '),
      totalQueries: this.totalQueries,
      numQueriesRun: this.numQueriesRun,
      old: {
        apiEnv: this.oldApiEnv,
        responseTimes: makeResponseTimesHistogram(finishedStats.old.responseTimes),
        statusCodes: finishedStats.old.statusCodes,
      },
      new: this.newApiEnv
        ? {
          apiEnv: this.newApiEnv,
          responseTimes: makeResponseTimesHistogram(finishedStats.new.responseTimes),
          statusCodes: finishedStats.new.statusCodes,
        }
        : undefined,
      changes: this.changes,
    };
  }

  finished(finishedStats: FinishedStats): void {
    this.write(JSON.stringify(this.finishedDict(finishedStats), null, 2));
  }
}
