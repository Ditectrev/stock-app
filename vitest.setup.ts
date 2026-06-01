import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};
global.localStorage = localStorageMock as unknown as Storage;

// Mock HTMLCanvasElement and CanvasRenderingContext2D
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillStyle: "",
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Lightweight Charts
vi.mock("lightweight-charts", () => {
  const mockSeries = () => ({
    setData: vi.fn(),
    applyOptions: vi.fn(),
    setMarkers: vi.fn(),
    priceScale: vi.fn(() => ({
      applyOptions: vi.fn(),
    })),
  });

  return {
    createChart: vi.fn(() => ({
      addSeries: vi.fn(mockSeries), // Generic addSeries method
      addAreaSeries: vi.fn(mockSeries),
      addLineSeries: vi.fn(mockSeries),
      addCandlestickSeries: vi.fn(mockSeries),
      addHistogramSeries: vi.fn(mockSeries),
      addBaselineSeries: vi.fn(mockSeries),
      timeScale: vi.fn(() => ({
        fitContent: vi.fn(),
        scrollToPosition: vi.fn(),
        applyOptions: vi.fn(),
        scrollToRealTime: vi.fn(),
        getVisibleRange: vi.fn(),
        setVisibleRange: vi.fn(),
      })),
      priceScale: vi.fn(() => ({
        applyOptions: vi.fn(),
      })),
      applyOptions: vi.fn(),
      resize: vi.fn(),
      remove: vi.fn(),
      subscribeCrosshairMove: vi.fn(),
      unsubscribeCrosshairMove: vi.fn(),
      subscribeClick: vi.fn(),
      unsubscribeClick: vi.fn(),
      takeScreenshot: vi.fn(),
    })),
    ColorType: {
      Solid: 0,
      VerticalGradient: 1,
    },
    CrosshairMode: {
      Normal: 0,
      Magnet: 1,
      Hidden: 2,
    },
    LineStyle: {
      Solid: 0,
      Dotted: 1,
      Dashed: 2,
      LargeDashed: 3,
      SparseDotted: 4,
    },
    LineType: {
      Simple: 0,
      WithSteps: 1,
      Curved: 2,
    },
    PriceScaleMode: {
      Normal: 0,
      Logarithmic: 1,
      Percentage: 2,
      IndexedTo100: 3,
    },
    // Export series constructors
    LineSeries: vi.fn(),
    AreaSeries: vi.fn(),
    CandlestickSeries: vi.fn(),
    HistogramSeries: vi.fn(),
    BaselineSeries: vi.fn(),
  };
});
