import { createFileRoute } from "@tanstack/react-router";
import { getRoomState, isValidRoomId, setRoomState } from "@/lib/vetoStore";
import type { VetoState } from "@/lib/vetoMachine";

export const Route = createFileRoute("/api/veto/$roomId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!isValidRoomId(params.roomId)) {
          return Response.json({ error: "invalid_room" }, { status: 400 });
        }

        const state = await getRoomState(params.roomId);
        if (!state) {
          return Response.json({ state: null }, { status: 404 });
        }

        return Response.json({ state });
      },
      PUT: async ({ request, params }) => {
        if (!isValidRoomId(params.roomId)) {
          return Response.json({ error: "invalid_room" }, { status: 400 });
        }

        const body = (await request.json()) as { state?: VetoState };
        if (!body.state) {
          return Response.json({ error: "missing_state" }, { status: 400 });
        }

        await setRoomState(params.roomId, body.state);
        return Response.json({ ok: true });
      },
    },
  },
});
