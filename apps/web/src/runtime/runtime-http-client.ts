import { buildPageRuntimePlan } from './runtime-page-plan';

export async function fetchRuntimePage(page, params = {}, fetcher = fetch) {
  const plan = buildPageRuntimePlan(page, params);
  if (!plan) {
    throw new Error('Unknown runtime page: ' + page);
  }

  const response = await fetcher(plan.endpoint, {
    method: 'GET',
    headers: {
      accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Runtime request failed for ' + page + ' with status ' + response.status);
  }

  const payload = await response.json();
  return {
    plan: plan,
    payload: payload
  };
}
