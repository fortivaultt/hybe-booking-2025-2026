import serverless from "serverless-http";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { createServer } from "../../server";

let cachedHandler: ReturnType<typeof serverless> | null = null;

async function getHandler() {
  if (!cachedHandler) {
    const app = await createServer();
    cachedHandler = serverless(app as any);
  }
  return cachedHandler;
}

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext,
) => {
  const h = await getHandler();
  return h(event as any, context as any);
};
