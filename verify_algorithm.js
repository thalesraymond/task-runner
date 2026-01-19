
function sanitizeMermaidId(id) {
    return id.replaceAll(/ /g, "_").replaceAll(/:/g, "_").replaceAll(/"/g, "_");
}

function getMermaidGraph(steps) {
    const graphLines = ["graph TD"];
    const nameToIdMap = new Map();
    const usedIds = new Set();

    const safeLabel = (name) => JSON.stringify(name);
    const sanitize = (name) => sanitizeMermaidId(name);

    // First pass: generate unique IDs for all steps
    for (const step of steps) {
        let id = sanitize(step.name);
        let counter = 1;
        const originalId = id;

        while (usedIds.has(id)) {
            id = `${originalId}_${counter}`;
            counter++;
        }

        usedIds.add(id);
        nameToIdMap.set(step.name, id);
    }

    // Add nodes
    for (const step of steps) {
        const id = nameToIdMap.get(step.name);
        graphLines.push(`  ${id}[${safeLabel(step.name)}]`);
    }

    // Add edges
    for (const step of steps) {
        if (step.dependencies) {
            for (const dep of step.dependencies) {
                const fromId = nameToIdMap.get(dep);
                const toId = nameToIdMap.get(step.name);
                if (fromId) {
                    graphLines.push(`  ${fromId} --> ${toId}`);
                }
            }
        }
    }

    return [...new Set(graphLines)].join("\n");
}

const steps = [
    { name: "Task 1" },
    { name: "Task: 1" }
];

const graph = getMermaidGraph(steps);
console.log(graph);

const nodeLines = graph.split('\n').filter(line => line.includes('[') && line.includes(']'));
const ids = nodeLines.map(line => line.split('[')[0].trim());
const uniqueIds = new Set(ids);

console.log("Unique IDs found:", uniqueIds);
if (uniqueIds.size === 2) {
    console.log("SUCCESS");
} else {
    console.log("FAILURE");
    process.exit(1);
}
