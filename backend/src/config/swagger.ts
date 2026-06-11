import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Kort Interiors API",
            version: "1.0.0",
            description: "API documentation for Kort Interiors backend",
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}/api/${process.env.API_VERSION || "v1"}`,
            },
        ],
    },
    apis: ["./src/routes/*.ts"], // <-- Path to your route files for JSDoc comments
};

export const swaggerSpec = swaggerJSDoc(options);