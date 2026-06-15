package runner

import (
	"context"
	"sync"
)

type eventWithContext struct {
	ctx   context.Context
	event Event
}

// EventDispatcher broadcasts events to registered plugins asynchronously.
type EventDispatcher struct {
	mu          sync.RWMutex
	plugins     []any
	closed      bool
	activeSends sync.WaitGroup
	eventCh     chan eventWithContext
	wg          sync.WaitGroup
	cancel      context.CancelFunc
}

// NewEventDispatcher creates a new dispatcher and starts its background goroutine.
func NewEventDispatcher() *EventDispatcher {
	ctx, cancel := context.WithCancel(context.Background())
	d := &EventDispatcher{
		plugins: make([]any, 0),
		eventCh: make(chan eventWithContext, 100), // buffered channel
		cancel:  cancel,
	}

	d.wg.Add(1)
	go d.start(ctx)

	return d
}

// RegisterPlugin adds a plugin to the dispatcher safely.
func (d *EventDispatcher) RegisterPlugin(plugin any) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.plugins = append(d.plugins, plugin)
}

// Dispatch sends an event to the background goroutine for broadcasting.
// It safely ignores events sent after the dispatcher has been shutdown.
func (d *EventDispatcher) Dispatch(ctx context.Context, event Event) {
	d.mu.RLock()
	if d.closed {
		d.mu.RUnlock()
		return
	}
	d.activeSends.Add(1)
	d.mu.RUnlock()

	defer d.activeSends.Done()
	d.eventCh <- eventWithContext{ctx: ctx, event: event}
}

// start runs the background loop to process events.
func (d *EventDispatcher) start(ctx context.Context) {
	defer d.wg.Done()
	for {
		select {
		case <-ctx.Done():
			return
		case ev, ok := <-d.eventCh:
			if !ok {
				// Channel closed, graceful shutdown
				return
			}
			d.broadcast(ev.ctx, ev.event)
		}
	}
}

// broadcast synchronously calls listener methods for the given event on registered plugins.
func (d *EventDispatcher) broadcast(ctx context.Context, event Event) {
	d.mu.RLock()
	pluginsCopy := make([]any, len(d.plugins))
	copy(pluginsCopy, d.plugins)
	d.mu.RUnlock()

	for _, p := range pluginsCopy {
		switch e := event.(type) {
		case WorkflowStartEvent:
			if l, ok := p.(WorkflowStartListener); ok {
				l.OnWorkflowStart(ctx, e)
			}
		case WorkflowEndEvent:
			if l, ok := p.(WorkflowEndListener); ok {
				l.OnWorkflowEnd(ctx, e)
			}
		case TaskStartEvent:
			if l, ok := p.(TaskStartListener); ok {
				l.OnTaskStart(ctx, e)
			}
		case TaskEndEvent:
			if l, ok := p.(TaskEndListener); ok {
				l.OnTaskEnd(ctx, e)
			}
		}
	}
}

// Shutdown gracefully stops the dispatcher, waiting for pending events to be processed.
// It also ensures that any future Dispatch calls are safely ignored.
func (d *EventDispatcher) Shutdown() {
	d.mu.Lock()
	if d.closed {
		d.mu.Unlock()
		return
	}
	d.closed = true
	d.mu.Unlock()

	d.activeSends.Wait() // wait for pending Dispatch sends to complete
	close(d.eventCh)     // signal no more events
	d.wg.Wait()          // wait for drain
	d.cancel()           // clean up context
}
