import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requestJson } = vi.hoisted(() => ({ requestJson: vi.fn() }));

vi.mock("@/core/lib/api/fetcher", () => ({ requestJson }));

import { RealtimeSalesMap } from "./RealtimeSalesMap";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  close = vi.fn();

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }
}

describe("RealtimeSalesMap lifecycle", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);
    requestJson.mockImplementation(() => new Promise(() => undefined));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("aborts the snapshot request and closes the socket on unmount", async () => {
    requestJson.mockReset();
    requestJson
      .mockImplementationOnce(() => new Promise(() => undefined))
      .mockResolvedValueOnce({ ticket: "analytics-ticket" });

    const view = render(<RealtimeSalesMap />);
    await waitFor(() => expect(requestJson).toHaveBeenCalledTimes(2));

    const signal = requestJson.mock.calls[0]?.[1]?.signal as AbortSignal;
    const socket = FakeWebSocket.instances[0]!;
    expect(signal.aborted).toBe(false);

    view.unmount();

    expect(signal.aborted).toBe(true);
    expect(socket.close).toHaveBeenCalledOnce();
    expect(socket.onopen).toBeNull();
    expect(socket.onclose).toBeNull();
    expect(socket.onerror).toBeNull();
    expect(socket.onmessage).toBeNull();
  });
});
