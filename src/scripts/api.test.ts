import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetch24h, fetchLatest, fetchMapping, fetchTimeseries } from "./api";

interface SentRequest {
  url: string;
  method: string;
  headerNames: string[];
}

const ITEM_ID = 4151;

describe("price API requests", () => {
  let sentRequests: SentRequest[] = [];

  beforeEach(() => {
    sentRequests = [];
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input, init) => {
        const request = new Request(input, init);
        sentRequests.push({
          url: request.url,
          method: request.method,
          headerNames: [...request.headers.keys()],
        });
        return Response.json({ data: [] });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends plain GETs that need no CORS preflight", async () => {
    await Promise.all([
      fetchMapping(),
      fetchLatest(),
      fetch24h(),
      fetchTimeseries(ITEM_ID, "5m"),
    ]);

    expect(sentRequests).toHaveLength(4);
    for (const request of sentRequests) {
      expect(request, request.url).toMatchObject({
        method: "GET",
        headerNames: [],
      });
    }
  });
});
