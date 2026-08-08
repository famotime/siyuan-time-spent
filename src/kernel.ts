class KernelPlugin {
    siyuan: any;
    ws: any;
    es: any;

    constructor() {
        this.siyuan = (globalThis as any).siyuan;
        this.ws = null;
        this.es = null;

        this.siyuan.plugin.lifecycle.onload = this.onload.bind(this);
        this.siyuan.plugin.lifecycle.onrunning = this.onrunning.bind(this);
        this.siyuan.plugin.lifecycle.onunload = this.onunload.bind(this);
        this.siyuan.event.handler = this.eventHandler.bind(this);
        this.siyuan.server.private.http.handler = this.httpHandler.bind(this);
        this.siyuan.server.private.ws.handler = this.wsHandler.bind(this);
        this.siyuan.server.private.es.handler = this.esHandler.bind(this);
    }

    async onload() {
        const { rpc, mcp, storage, logger, plugin } = this.siyuan;
        await logger.info("onload: plugin name =", plugin.name);

        await rpc.bind("echo", async (...args: any[]) => {
            await logger.debug("RPC method [echo] called with:", args);
            return args;
        }, "Returns all received arguments unchanged.");

        await rpc.bind("echo-notify", async (...args: any[]) => {
            await logger.debug("RPC method [echo-notify] called with:", args);
            await rpc.broadcast("notify", args);
            return args;
        }, "Broadcasts the received arguments to all connected clients.");
    }

    async onrunning() {
        const { logger } = this.siyuan;
        await logger.info("onrunning: plugin is running");
    }

    async onunload() {
        const { rpc, logger } = this.siyuan;
        await rpc.unbind("echo");
        await rpc.unbind("echo-notify");
        await logger.info("onunload: cleanup complete");
    }

    async eventHandler(event: any) {
        const { event: siyuanEvent, logger } = this.siyuan;
        await logger.debug("event received:", event);
        await siyuanEvent.emit("plugin", { id: event.id, type: "echo", detail: event });
    }

    async httpHandler(req: any) {
        return {
            statusCode: 200,
            headers: {
                "X-Plugin": [this.siyuan.plugin.name]
            },
            body: {
                data: {
                    type: "JSON",
                    data: { path: req.url.path, method: req.request.method, query: req.url.query }
                }
            }
        };
    }

    async wsHandler(req: any) {
        req.port.onopen = async (e: any) => {
            await req.port.send("Hello from plugin WebSocket server!");
        };
        req.port.onmessage = async (e: any) => {
            if (typeof e.data === 'string') {
                await req.port.send(e.data);
            }
        };
    }

    async esHandler(req: any) {
        req.port.onopen = async (e: any) => {
            const now = Date.now();
            req.port.send({ event: "update", data: JSON.stringify({ ts: now }), id: now.toString(), retry: 5000 });
            req.port.send({ data: "Connected to plugin SSE!" });
        };
    }
}

new KernelPlugin();
