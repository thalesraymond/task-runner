
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

        // START DEBUG
        console.log(`Processing "${step.name}" -> sanitized "${id}"`);
        // END DEBUG

        const originalId = id;

        while (usedIds.has(id)) {
            console.log(`Collision for "${id}". trying suffix...`);
            id = `${originalId}_${counter}`;
            counter++;
        }

        usedIds.add(id);
        nameToIdMap.set(step.name, id);
        console.log(`Assigned ID "${id}" for "${step.name}"`);
    }

    // Add nodes
    for (const step of steps) {
        const id = nameToIdMap.get(step.name);
        graphLines.push(`  ${id}[${safeLabel(step.name)}]`);
    }

    return [...new Set(graphLines)].join("\n");
}

const steps = [
    { name: "Task A" }, // Task_A
    { name: "Task_A" }  // Task_A -> COLLISION -> Task_A_1
];

const graph = getMermaidGraph(steps);
console.log(graph);

const nodeLines = graph.split('\n').filter(line => line.includes('[') && line.includes(']'));
const ids = nodeLines.map(line => line.split('[')[0].trim());
const uniqueIds = new Set(ids);

console.log("Unique IDs found:", uniqueIds);
if (uniqueIds.size === 2 && uniqueIds.has("Task_A_1") && uniqueIds.has("Task_A")) {
    console.log("SUCCESS");
} else {
    console.log("FAILURE");
    process.exit(1);
}
