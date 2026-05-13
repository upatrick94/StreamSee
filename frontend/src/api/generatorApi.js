const API_HOST = import.meta.env.VITE_API_HOST || window.location.hostname;
const API_PORT = import.meta.env.VITE_API_PORT || "8080";
const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || window.location.protocol;
const API_BASE_URL = `${API_PROTOCOL}//${API_HOST}:${API_PORT}`;
const GRAPHQL_URL = `${API_BASE_URL}/graphql`;

async function graphqlRequest(query, variables = {}) {
    const response = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query,
            variables,
        }),
    });

    if (!response.ok) {
        throw new Error("GraphQL request failed.");
    }

    const payload = await response.json();

    if (payload.errors?.length) {
        throw new Error(payload.errors.map((error) => error.message).join(" | "));
    }

    return payload.data;
}

export async function startGeneratorApi(batchSize = 3, intervalSeconds = 5) {
    const data = await graphqlRequest(
        `
        mutation StartGenerator($batchSize: Int!, $intervalSeconds: Int!) {
            startGenerator(batchSize: $batchSize, intervalSeconds: $intervalSeconds) {
                running
                batchSize
                intervalSeconds
            }
        }
        `,
        { batchSize, intervalSeconds }
    );

    return data.startGenerator;
}

export async function stopGeneratorApi() {
    const data = await graphqlRequest(
        `
        mutation StopGenerator {
            stopGenerator {
                running
                batchSize
                intervalSeconds
            }
        }
        `
    );

    return data.stopGenerator;
}

export async function fetchGeneratorStatusApi() {
    const data = await graphqlRequest(
        `
        query GeneratorStatus {
            generatorStatus {
                running
                batchSize
                intervalSeconds
            }
        }
        `
    );

    return data.generatorStatus;
}
