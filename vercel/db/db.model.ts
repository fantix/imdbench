import Dexie, {Table} from "dexie";

export interface Plan {
  id?: number;
  ran?: Date;
  name: string;
  db: string;
  app: string;
  query: string;
  warmUp: number;
  duration: number;
  concurrency: number;
  latency?: number;
  throughput?: number;
  data?: string;
}

export class IDB extends Dexie {
  plans!: Table<Plan>;

  constructor() {
    super("imdbench");
    this.version(1).stores({
      plans: '++id, created'
    });
  }
}

export const idb = new IDB();
