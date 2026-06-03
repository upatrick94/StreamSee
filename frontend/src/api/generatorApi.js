function trimTrailingSlash(value) {
    return value.replace(/\/+$/, "");
}

const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");
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
