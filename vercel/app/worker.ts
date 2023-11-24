'use client'

import {Plan} from "@/db/db.model";
import {queries} from "@/app/index";
import {MessageType} from "@/app/shared";

addEventListener('message', async (event: MessageEvent<{ ci: number, ids: any[], plan: Plan }>) => {
  const {ci, ids, plan} = event.data;
  const isGet = queries[plan.query as keyof typeof queries].method == 'get';
  const body = JSON.stringify(ids[0]);
  const timeout = 2_000;
  const latencyStats = new Float64Array(timeout * 100);

  async function run(i: number) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    let resp;
    if (isGet) {
      resp = await fetch(
        `/api/${plan.query}/${ids[i]}?db=${plan.db}&app=${plan.app}`, {
          signal: controller.signal,
        });
    } else {
      resp = await fetch(`/api/${plan.query}?db=${plan.db}&app=${plan.app}`, {
        method: 'POST',
        body,
      });
    }
    await resp.json();
    clearTimeout(timeoutId);
  }

  if (plan.warmUp > 0) {
    const startTime = performance.now();
    do {
      await run(0);
    } while (performance.now() - startTime < plan.warmUp * 1000);
  }

  const duration = plan.duration * 1_000;
  let minLatency = Infinity;
  let maxLatency = 0.0;
  let i = Math.floor((ids.length / plan.concurrency) * ci) % ids.length;
  const startTime = performance.now();
  let lastTime = startTime;
  let lastProgress = startTime;
  let now = startTime;
  do {
    await run(i);
    now = performance.now();
    const reqTime = now - lastTime;
    latencyStats[Math.min(latencyStats.length - 1, Math.round(reqTime * 100))] += 1;
    if (reqTime > maxLatency) {
      maxLatency = reqTime;
    }
    if (reqTime < minLatency) {
      minLatency = reqTime;
    }
    lastTime = now;
    if (now - lastProgress > 200) {
      postMessage({
        type: MessageType.Progress,
        data: (now - lastProgress) / duration,
      });
      lastProgress = now;
    }
    i += 1;
    i = i % ids.length;
  } while (now - startTime < duration);
  postMessage({
    type: MessageType.Done,
    data: {latencyStats, minLatency, maxLatency},
  })
})
