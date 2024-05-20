import { WorkHandler } from 'pg-boss';
import ExperimentModel from '../../models/experiments';
import DatasetModel from '../../models/datasets';
import {
  EvalMetricOutput,
  ExperimentTestCaseDataset,
  ExperimentTestCaseResult,
} from '../../evaluations';
import { AgentRequestExecutor } from '../../models/agent';

export interface ExperimentTestRunnerData {
  filePath: string;
}

const runTestCase = async (
  testCase: ExperimentTestCaseDataset,
  agentId: string
): Promise<ExperimentTestCaseResult> => {
  const response = await AgentRequestExecutor.chat({
    agentId,
    content: testCase.input,
    featureFlags: {},
  });
  const metrics = await Promise.all(
    testCase.metrics.map(async (metric) => {
      const result = await metric.evaluate(testCase.input, response);
      return {
        name: metric.label,
        value: result,
      };
    })
  );
  const metricsReport: Record<string, EvalMetricOutput> = {};
  metrics.forEach((metric) => {
    metricsReport[metric.name] = metric.value;
  });
  return {
    input: testCase.input,
    tags: testCase.tags,
    output: response,
    metrics: metricsReport,
  };
};

export const ExperimentTestRunner: WorkHandler<
  ExperimentTestRunnerData
> = async (input) => {
  try {
    await ExperimentModel.updateTestJobStatus(input.data.filePath, {
      id: input.id,
      status: 'active',
    });
    const test = await ExperimentModel.readTestJSON(input.data.filePath);
    const datasetFetcher =
      await DatasetModel.getDatasetByName<ExperimentTestCaseDataset>(
        test.testCaseDatasetName
      );
    const dataset = await datasetFetcher.fetch();
    const results = await Promise.all(
      dataset.map((testCase) => runTestCase(testCase, test.agentId))
    );
    await ExperimentModel.setTestResult(input.data.filePath, results);
    await ExperimentModel.updateTestJobStatus(input.data.filePath, {
      id: input.id,
      status: 'completed',
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    await ExperimentModel.updateTestJobStatus(input.data.filePath, {
      id: input.id,
      status: 'failed',
      errorMessage: message,
    });
  }
};