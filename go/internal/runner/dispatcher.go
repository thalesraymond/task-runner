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
	plugins []any
	eventCh chan eventWithContext
	wg      sync.WaitGroup
	cancel  context.CancelFunc
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

// RegisterPlugin adds a plugin to the dispatcher.
func (d *EventDispatcher) RegisterPlugin(plugin any) {
	d.plugins = append(d.plugins, plugin)
}

// Dispatch sends an event to the background goroutine for broadcasting.
// It is non-blocking up to the channel's buffer size.
func (d *EventDispatcher) Dispatch(ctx context.Context, event Event) {
	select {
	case d.eventCh <- eventWithContext{ctx: ctx, event: event}:
	default:
		// Channel is full, block to ensure delivery (drop is bad for telemetry).
		d.eventCh <- eventWithContext{ctx: ctx, event: event}
	}
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
	for _, p := range d.plugins {
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
func (d *EventDispatcher) Shutdown() {
	close(d.eventCh) // signal no more events
	d.wg.Wait()      // wait for drain
	d.cancel()       // clean up context
}
