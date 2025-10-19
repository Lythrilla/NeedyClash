import { useEffect, useRef, useCallback, useReducer } from "react";

import { useTrafficData } from "./use-traffic-data";

export interface ITrafficDataPoint {
  up: number;
  down: number;
  timestamp: number;
  name: string;
}

interface ICompressedDataPoint {
  up: number;
  down: number;
  timestamp: number;
  samples: number;
}

interface ISamplingConfig {
  rawDataMinutes: number;
  compressedDataMinutes: number;
  compressionRatio: number;
}

class ReferenceCounter {
  private count = 0;
  private callbacks: (() => void)[] = [];

  increment(): () => void {
    this.count++;

    if (this.count === 1) {
      this.callbacks.forEach((cb) => cb());
    }

    return () => {
      this.count--;

      if (this.count === 0) {
        this.callbacks.forEach((cb) => cb());
      }
    };
  }

  onCountChange(callback: () => void) {
    this.callbacks.push(callback);
  }

  getCount(): number {
    return this.count;
  }
}

class TrafficDataSampler {
  private rawBuffer: ITrafficDataPoint[] = [];
  private compressedBuffer: ICompressedDataPoint[] = [];
  private config: ISamplingConfig;
  private compressionQueue: ITrafficDataPoint[] = [];

  constructor(config: ISamplingConfig) {
    this.config = config;
  }

  addDataPoint(point: ITrafficDataPoint): void {
    this.rawBuffer.push(point);

    const rawCutoff = Date.now() - this.config.rawDataMinutes * 60 * 1000;
    let rawStartIndex = 0;
    for (let i = 0; i < this.rawBuffer.length; i++) {
      if (this.rawBuffer[i].timestamp > rawCutoff) {
        rawStartIndex = i;
        break;
      }
    }
    if (rawStartIndex > 0) {
      this.rawBuffer = this.rawBuffer.slice(rawStartIndex);
    }

    this.compressionQueue.push(point);

    if (this.compressionQueue.length >= this.config.compressionRatio) {
      this.compressData();
    }

    const compressedCutoff =
      Date.now() - this.config.compressedDataMinutes * 60 * 1000;
    let compressedStartIndex = 0;
    for (let i = 0; i < this.compressedBuffer.length; i++) {
      if (this.compressedBuffer[i].timestamp > compressedCutoff) {
        compressedStartIndex = i;
        break;
      }
    }
    if (compressedStartIndex > 0) {
      this.compressedBuffer = this.compressedBuffer.slice(compressedStartIndex);
    }
  }

  private compressData(): void {
    if (this.compressionQueue.length === 0) return;

    const totalUp = this.compressionQueue.reduce((sum, p) => sum + p.up, 0);
    const totalDown = this.compressionQueue.reduce((sum, p) => sum + p.down, 0);
    const avgTimestamp =
      this.compressionQueue.reduce((sum, p) => sum + p.timestamp, 0) /
      this.compressionQueue.length;

    const compressedPoint: ICompressedDataPoint = {
      up: totalUp / this.compressionQueue.length,
      down: totalDown / this.compressionQueue.length,
      timestamp: avgTimestamp,
      samples: this.compressionQueue.length,
    };

    this.compressedBuffer.push(compressedPoint);
    this.compressionQueue = [];
  }

  getDataForTimeRange(minutes: number): ITrafficDataPoint[] {
    const cutoff = Date.now() - minutes * 60 * 1000;

    if (minutes <= this.config.rawDataMinutes) {
      return this.rawBuffer.filter((p) => p.timestamp > cutoff);
    }

    const rawData = this.rawBuffer.filter((p) => p.timestamp > cutoff);
    const compressedData = this.compressedBuffer
      .filter(
        (p) =>
          p.timestamp > cutoff &&
          p.timestamp <= Date.now() - this.config.rawDataMinutes * 60 * 1000,
      )
      .map((p) => ({
        up: p.up,
        down: p.down,
        timestamp: p.timestamp,
        name: new Date(p.timestamp).toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      }));

    return [...compressedData, ...rawData].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
  }

  getStats() {
    return {
      rawBufferSize: this.rawBuffer.length,
      compressedBufferSize: this.compressedBuffer.length,
      compressionQueueSize: this.compressionQueue.length,
      totalMemoryPoints: this.rawBuffer.length + this.compressedBuffer.length,
    };
  }

  clear(): void {
    this.rawBuffer = [];
    this.compressedBuffer = [];
    this.compressionQueue = [];
  }
}

const refCounter = new ReferenceCounter();
let globalSampler: TrafficDataSampler | null = null;

export const useTrafficMonitorEnhanced = () => {
  const {
    response: { data: traffic },
  } = useTrafficData();

  if (!globalSampler) {
    globalSampler = new TrafficDataSampler({
      rawDataMinutes: 10,
      compressedDataMinutes: 60,
      compressionRatio: 5,
    });
  }

  const [, forceRender] = useReducer((version: number) => version + 1, 0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const bumpRenderVersion = useCallback(() => {
    forceRender();
  }, []);

  useEffect(() => {
    const cleanup = refCounter.increment();
    cleanupRef.current = cleanup;

    return () => {
      cleanup();
      cleanupRef.current = null;
    };
  }, []);

  useEffect(() => {
    refCounter.onCountChange(() => {});
  }, []);

  useEffect(() => {
    if (globalSampler) {
      const timestamp = Date.now();
      const dataPoint: ITrafficDataPoint = {
        up: traffic?.up || 0,
        down: traffic?.down || 0,
        timestamp,
        name: new Date(timestamp).toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };
      globalSampler.addDataPoint(dataPoint);
    }
  }, [traffic]);
  const getDataForTimeRange = useCallback(
    (minutes: number): ITrafficDataPoint[] => {
      if (!globalSampler) return [];
      return globalSampler.getDataForTimeRange(minutes);
    },
    [],
  );

  const clearData = useCallback(() => {
    if (globalSampler) {
      globalSampler.clear();
      bumpRenderVersion();
    }
  }, [bumpRenderVersion]);

  const getSamplerStats = useCallback(() => {
    return (
      globalSampler?.getStats() || {
        rawBufferSize: 0,
        compressedBufferSize: 0,
        compressionQueueSize: 0,
        totalMemoryPoints: 0,
      }
    );
  }, []);

  return {
    graphData: {
      dataPoints: globalSampler?.getDataForTimeRange(60) || [],
      getDataForTimeRange,
      clearData,
    },
    samplerStats: getSamplerStats(),
    referenceCount: refCounter.getCount(),
  };
};

export const useTrafficGraphDataEnhanced = () => {
  const { graphData, samplerStats, referenceCount } =
    useTrafficMonitorEnhanced();

  return {
    ...graphData,
    samplerStats,
    referenceCount,
  };
};
