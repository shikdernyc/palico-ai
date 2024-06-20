import {
  ConversationRequestContent,
  ConversationResponse,
  EvalMetric,
  EvalMetricOutput,
} from '@palico-ai/common';
import { ZodSchema } from 'zod';

export interface ValidJSONMetricsParams {
  schema?: ZodSchema;
  responseKey?: keyof Pick<ConversationResponse, 'data' | 'message'>;
}

/**
 * Checks if the response is a valid JSON.
 * Returns 0 if the response is not valid JSON, 1 if it is.
 */
export class ValidJSONMetrics implements EvalMetric {
  private params: ValidJSONMetricsParams;
  label = 'valid-json';

  constructor(params: ValidJSONMetricsParams) {
    this.params = params;
  }

  async evaluate(
    _: ConversationRequestContent,
    response: ConversationResponse
  ): Promise<EvalMetricOutput> {
    try {
      let json = response.data;
      if (this.params.responseKey === 'message') {
        if (!response.message) {
          return 0;
        }
        json = JSON.parse(response.message);
      }
      if (this.params.schema) {
        await this.params.schema.parseAsync(json);
      }
      return 1;
    } catch {
      return 0;
    }
  }
}