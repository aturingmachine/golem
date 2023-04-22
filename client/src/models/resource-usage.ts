export interface CpuInfo {
  model: string;
  speed: number;
  times: {
    user: number;
    nice: number;
    sys: number;
    idle: number;
    irq: number;
  };
}

export interface ResourceData  {
  load: number
  totalmem: number
  freemem: number
  uptime: number
}
