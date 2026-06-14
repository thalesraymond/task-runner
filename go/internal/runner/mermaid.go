package runner

import (
	"fmt"
	"regexp"
	"strings"
)

var mermaidIDRegex = regexp.MustCompile(`[^a-zA-Z0-9_-]`)

// escapeMermaidName safely escapes characters that would break Mermaid syntax.
var escapeMermaidName = strings.NewReplacer(
	"\"", "&quot;",
	"[", "&#91;",
	"]", "&#93;",
	"(", "&#40;",
	")", "&#41;",
	"{", "&#123;",
	"}", "&#125;",
).Replace

// GenerateMermaidGraph creates a Mermaid.js flowchart from a TaskGraph.
func GenerateMermaidGraph(graph *TaskGraph) string {
	nodeLines := []string{"graph TD"}
	
	idMap := make(map[string]string)
	usedIDs := make(map[string]bool)
	baseIDCounters := make(map[string]int)

	getUniqueID := func(name string) string {
		if id, exists := idMap[name]; exists {
			return id
		}

		sanitized := mermaidIDRegex.ReplaceAllString(name, "_")
		uniqueID := sanitized
		
		counter := 1
		if count, exists := baseIDCounters[sanitized]; exists {
			counter = count
		}

		for usedIDs[uniqueID] {
			uniqueID = fmt.Sprintf("%s_%d", sanitized, counter)
			counter++
		}

		baseIDCounters[sanitized] = counter
		usedIDs[uniqueID] = true
		idMap[name] = uniqueID
		return uniqueID
	}

	processedNodes := make(map[string]bool)
	var edgeLines []string
	
	for _, task := range graph.Tasks {
		name := task.ID
		stepID := getUniqueID(name)

		if !processedNodes[stepID] {
			processedNodes[stepID] = true
			escapedName := escapeMermaidName(name)
			nodeLines = append(nodeLines, fmt.Sprintf("  %s[\"%s\"]", stepID, escapedName))
		}

		for _, dep := range task.Dependencies {
			depID := getUniqueID(dep)
			edgeLines = append(edgeLines, fmt.Sprintf("  %s --> %s", depID, stepID))
		}
	}
	
	// Deduplicate edge lines like a Set in TypeScript
	edgeMap := make(map[string]bool)
	var uniqueEdgeLines []string
	for _, edge := range edgeLines {
		if !edgeMap[edge] {
			edgeMap[edge] = true
			uniqueEdgeLines = append(uniqueEdgeLines, edge)
		}
	}

	result := strings.Join(nodeLines, "\n")
	if len(uniqueEdgeLines) > 0 {
		result += "\n" + strings.Join(uniqueEdgeLines, "\n")
	}
	return result
}
