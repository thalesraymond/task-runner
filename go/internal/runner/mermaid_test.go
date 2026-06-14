package runner

import (
	"strings"
	"testing"
)

func TestGenerateMermaidGraph_Simple(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A", Dependencies: []string{}},
			{ID: "B", Dependencies: []string{"A"}},
			{ID: "C", Dependencies: []string{"A"}},
			{ID: "D", Dependencies: []string{"B", "C"}},
		},
	}

	out := GenerateMermaidGraph(graph)
	expectedLines := []string{
		"graph TD",
		"  A[\"A\"]",
		"  B[\"B\"]",
		"  C[\"C\"]",
		"  D[\"D\"]",
		"  A --> B",
		"  A --> C",
		"  B --> D",
		"  C --> D",
	}

	for _, line := range expectedLines {
		if !strings.Contains(out, line) {
			t.Errorf("expected output to contain: %q\nOutput was:\n%s", line, out)
		}
	}
}

func TestGenerateMermaidGraph_Sanitization(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A [test]", Dependencies: []string{}},
			{ID: "B {test}", Dependencies: []string{"A [test]"}},
		},
	}

	out := GenerateMermaidGraph(graph)

	if !strings.Contains(out, "A__test_[\"A &#91;test&#93;\"]") {
		t.Errorf("expected A to be sanitized and escaped, got: %s", out)
	}
	if !strings.Contains(out, "B__test_[\"B &#123;test&#125;\"]") {
		t.Errorf("expected B to be sanitized and escaped, got: %s", out)
	}
	if !strings.Contains(out, "A__test_ --> B__test_") {
		t.Errorf("expected correct sanitized edge, got: %s", out)
	}
}

func TestGenerateMermaidGraph_DuplicateSanitizedNames(t *testing.T) {
	graph := &TaskGraph{
		Tasks: []TaskDefinition{
			{ID: "A.test", Dependencies: []string{}},
			{ID: "A/test", Dependencies: []string{"A.test"}},
		},
	}

	out := GenerateMermaidGraph(graph)

	// Both sanitize to A_test, so second one should be A_test_1
	if !strings.Contains(out, "A_test[\"A.test\"]") {
		t.Errorf("expected A_test, got: %s", out)
	}
	if !strings.Contains(out, "A_test_1[\"A/test\"]") {
		t.Errorf("expected A_test_1, got: %s", out)
	}
	if !strings.Contains(out, "A_test --> A_test_1") {
		t.Errorf("expected correct sanitized edge, got: %s", out)
	}
}
