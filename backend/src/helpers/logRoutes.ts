import { Express } from "express";

const cleanPath = (regexp: any) => {
    if (!regexp) return "";

    return regexp.source
        .replace("^", "")
        .replace("\\/?", "")
        .replace("(?=\\/|$)", "")
        .replace("\\/", "/")
        .replace(/\\\//g, "/");
};

export const logRoutes = (app: Express) => {
    const routesMap = new Map<string, Set<string>>();

    app._router.stack.forEach((middleware: any) => {
        if (middleware.name === "router") {
            const basePath = cleanPath(middleware.regexp);

            middleware.handle.stack.forEach((handler: any) => {
                if (!handler.route) return;

                const methods = Object.keys(handler.route.methods).map((m) =>
                    m.toUpperCase()
                );

                const fullPath = `${basePath}${handler.route.path}`;

                if (!routesMap.has(fullPath)) {
                    routesMap.set(fullPath, new Set());
                }

                methods.forEach((m) => routesMap.get(fullPath)!.add(m));
            });
        }
    });

    console.log("\n🚀 Exposed API routes:");
    routesMap.forEach((methods, path) => {
        console.log(`  ${path} : ${Array.from(methods).join(", ")}`);
    });
};