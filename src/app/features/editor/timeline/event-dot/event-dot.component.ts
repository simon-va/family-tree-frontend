import { Component, input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { TimelineEventGroup } from '../timeline.model';

@Component({
  selector: 'app-timeline-event-dot',
  standalone: true,
  imports: [TooltipModule],
  host: { style: 'display: contents' },
  templateUrl: './event-dot.component.html',
  styleUrl: './event-dot.component.scss',
})
export class TimelineEventDotComponent {
  readonly group = input.required<TimelineEventGroup>();
  readonly leftPx = input.required<number>();
}
