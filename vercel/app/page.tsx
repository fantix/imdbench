'use client'

import Image from 'next/image'
import {listSettings, queries} from "@/app";
import React, {useState} from "react";
import {useLiveQuery} from "dexie-react-hooks";
import {idb, Plan} from "@/db/db.model";
import {Message, MessageType} from "@/app/shared";

export default function Home() {
  const settings = listSettings();

  const [order, setOrder] = React.useState("");
  const [selected, setSelected] = React.useState<number[]>([]);
  const [form, setForm] = React.useState<{
    warmUp: number,
    duration: number,
    concurrencyStr: string,
    benchmarks: string[],
    queries: string[],
  }>({
    warmUp: 5,
    duration: 60,
    concurrencyStr: "1,2,4,8",
    benchmarks: [],
    queries: [],
  });
  const plansList = useLiveQuery(async () => {
    const orders = order.split(",");
    return (await idb.plans.toArray()).sort((a, b) => {
      for (let o of orders) {
        let v = 1;
        if (o.startsWith("~")) {
          o = o.slice(1);
          v = -1;
        }
        const k = o as keyof Plan;
        if (a[k] === undefined || b[k] === undefined) {
          if (a[k] === undefined) {
            return b[k] === undefined ? 0 : v;
          } else {
            return -v;
          }
        } else if (a[k]! > b[k]!) {
          return v;
        } else if (a[k]! < b[k]!) {
          return -1 * v;
        }
      }
      return 0;
    });
  }, [order]);

  const generate = React.useCallback(async () => {
    const concurrency = form.concurrencyStr.split(",").flatMap(v => {
      const i = parseInt(v);
      return !isNaN(i) && i > 0 ? [i] : [];
    });
    setForm({...form, concurrencyStr: concurrency.join(",")});
    for (const b of form.benchmarks) {
      for (const query of form.queries) {
        for (const c of concurrency) {
          const [db, app] = b.split("/");
          const name = settings.filter(s => s.db == db && s.app == app)[0].name;
          await idb.plans.add({
            name,
            db,
            app,
            query,
            warmUp: form.warmUp,
            duration: form.duration,
            concurrency: c,
          });
        }
      }
    }
  }, [form]);

  const [running, setRunning] = useState({id: 0, progress: 0});

  async function runPlan(plan: Plan) {
    let progress = 0;
    const setupProgress = 0.15;
    const totalProgress = (setupProgress + plan.concurrency) / 100;

    function incrProgress(val: number) {
      progress += val;
      setRunning({id: plan.id!, progress: Math.min(100, Math.round(progress / totalProgress))});
    }

    incrProgress(0);
    const resp = await fetch(`/api/${plan.query}/setup?db=${plan.db}&app=${plan.app}&limit=10`);
    const ids = await resp.json();
    incrProgress(setupProgress);

    let workers: Worker[] = [];
    const done = new Promise((resolve, reject) => {
      const timeout = 2_000;
      const latencyStats = new Float64Array(timeout * 100);
      let minLatency = Infinity;
      let maxLatency = 0.0;
      let doneCount = 0;
      Array.from(Array(plan.concurrency).keys()).forEach(ci => {
          const worker = new Worker(new URL("./worker.ts", import.meta.url));
          workers.push(worker);
          worker.onmessage = (e: MessageEvent<Message>) => {
            switch (e.data.type) {
              case MessageType.Done:
                doneCount += 1;
                minLatency = Math.min(minLatency, e.data.data.minLatency);
                maxLatency = Math.max(maxLatency, e.data.data.maxLatency);
                for (let i = 0; i < latencyStats.length; i++) {
                  latencyStats[i] += e.data.data.latencyStats[i];
                }
                if (doneCount == plan.concurrency) {
                  const [nqueries, weightedSum] = latencyStats.reduce(
                    ([s, n], x, i) => [s + x, n + i * x],
                    [0, 0],
                  );
                  resolve({
                    latency: Math.round(weightedSum / nqueries / 100),
                    throughput: Math.round(nqueries / plan.duration),
                  });
                }
                break;

              case MessageType.Progress:
                incrProgress(e.data.data);
                break;
            }
          };
          worker.onerror = (e: ErrorEvent) => {
            reject(e);
          };
          worker.onmessageerror = (e: MessageEvent) => {
            reject(e);
          };
          worker.postMessage({ci, ids, plan});
        }
      );
    });
    let result: any;
    try {
      result = await done;
    } finally {
      for (const worker of workers) {
        worker.terminate();
      }
    }
    await idb.plans.update(
      plan.id!,
      {
        ran: new Date(),
        ...result,
      }
    );
  }

  const run = React.useCallback(async () => {
    try {
      for (const plan of plansList ?? []) {
        if (selected.indexOf(plan.id!, 0) > -1) {
          await runPlan(plan);
        }
      }
    } finally {
      setRunning({id: 0, progress: 0});
    }
  }, [selected, plansList]);

  const report = React.useCallback(async () => {
  }, [selected]);

  const deleteSelected = React.useCallback(async () => {
    for (const id of selected) {
      idb.plans.delete(id);
    }
    setSelected([]);
  }, [selected]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div
        className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <Image
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70]"
          src="/banner.jpg"
          alt="IMDBench"
          width={400}
          height={0}
          priority
        />
      </div>
      <div className="plans w-full">
        <p style={{display: "flex", alignItems: "center"}}>
          <button onClick={run} disabled={running.id > 0 || selected.length == 0}>Run</button>
          <button onClick={report} disabled={selected.length == 0}>Report</button>
          <button onClick={deleteSelected} disabled={running.id > 0 || selected.length == 0}>Delete</button>
          <span style={{flexGrow: 1}}></span>
          Order by:
          <input
            type="text"
            value={order}
            onChange={e => setOrder(e.target.value)}
            style={{width: "30%", minWidth: "10em", marginLeft: "5px"}}
          />
        </p>
        <table>
          <thead>
          <tr>
            <td>
              <input
                type="checkbox"
                onChange={e => {
                  if (e.target.checked) {
                    setSelected((plansList ?? []).map(p => p.id!));
                  } else {
                    setSelected([]);
                  }
                }}
              />
            </td>
            <td>ID</td>
            <td>Ran</td>
            <td>Name</td>
            <td>Database</td>
            <td>App</td>
            <td>Query</td>
            <td>Duration</td>
            <td>Concurrency</td>
            <td>Latency</td>
            <td>Throughput</td>
          </tr>
          </thead>
          <tbody>
          {
            plansList?.map((p: Plan, index: number) => (
              <tr key={index} className="progress-container">
                <td>
                  <div
                    className="progress"
                    style={{width: running.id == p.id ? `${running.progress}%` : p.ran === undefined ? '0' : '100%'}}
                  ></div>
                  <input
                    type="checkbox"
                    checked={selected.indexOf(p.id!, 0) > -1}
                    onChange={e => {
                      const a = [...selected];
                      if ((e.nativeEvent as any).shiftKey && a.length == 1 && a[0] != p.id) {
                        let i = plansList?.findIndex(plan => plan.id == a[0]);
                        const d = index > i ? 1 : -1;
                        do {
                          i += d;
                          a.push(plansList[i].id!);
                        } while (i != index);
                      } else {
                        const i = a.indexOf(p.id!, 0);
                        if (i > -1) {
                          a.splice(i, 1);
                        } else {
                          a.push(p.id!);
                        }
                      }
                      setSelected(a);
                    }}
                  />
                </td>
                <td>{p.id}</td>
                <td>
                  {
                    p.ran === undefined ? '-' :
                      `${p.ran.toLocaleDateString()} ${p.ran.toLocaleTimeString()}`
                  }
                </td>
                <td>{p.name}</td>
                <td>{p.db}</td>
                <td>{p.app}</td>
                <td>{p.query}</td>
                <td>{p.duration}s</td>
                <td>{p.concurrency}</td>
                <td>{p.latency === undefined ? '-' : `${p.latency}ms`}</td>
                <td>{p.throughput ?? '-'}</td>
              </tr>
            ))
          }
          </tbody>
        </table>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left">
        <ul className="box">
          Benchmark suites:
          {settings.map(({name, db, app, bootstrapped}) => (
            <li key={`${db}-${app}`}>
              <input
                type="checkbox"
                id={`${db}-${app}`}
                disabled={!bootstrapped}
                checked={form.benchmarks.indexOf(`${db}/${app}`, 0) > -1}
                onChange={() => {
                  const a = [...form.benchmarks];
                  const k = `${db}/${app}`;
                  const i = a.indexOf(k, 0);
                  if (i > -1) {
                    a.splice(i, 1);
                  } else {
                    a.push(k);
                  }
                  setForm({...form, benchmarks: a});
                }}
              />
              <label htmlFor={`${db}-${app}`}>{name}</label>
            </li>
          ))}
        </ul>
        <ul className="box">
          Queries:
          {Object.keys(queries).map(slug => (
            <li key={slug}>
              <input
                type="checkbox"
                id={`q-${slug}`}
                checked={form.queries.indexOf(slug, 0) > -1}
                onChange={() => {
                  const a = [...form.queries];
                  const i = a.indexOf(slug, 0);
                  if (i > -1) {
                    a.splice(i, 1);
                  } else {
                    a.push(slug);
                  }
                  setForm({...form, queries: a});
                }}
              />
              <label htmlFor={`q-${slug}`}>{slug}</label>
            </li>
          ))}
        </ul>
        <div className="box">
          <p>
            <span>Warm-up time (seconds):</span>
            <span className="grow"></span>
            <input
              type="text"
              value={form.warmUp}
              onChange={
                (e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 0)
                    setForm({...form, warmUp: parseInt(e.target.value)})
                }
              }
            />
          </p>
          <p>
            <span>Duration (seconds):</span>
            <span className="grow"></span>
            <input
              type="text"
              value={form.duration}
              onChange={
                (e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val > 0)
                    setForm({...form, duration: parseInt(e.target.value)})
                }
              }
            />
          </p>
          <p>
            <span>Concurrency:</span>
            <input
              type="text"
              className="grow"
              value={form.concurrencyStr}
              onChange={(e) => setForm({...form, concurrencyStr: e.target.value})}
            />
          </p>
          <p>
            <span className="grow"></span>
            <button
              onClick={generate}
              disabled={form.benchmarks.length == 0 || form.queries.length == 0}>
              Generate plan
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
