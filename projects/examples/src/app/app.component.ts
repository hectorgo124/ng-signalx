import { JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { signalxResource } from 'ng-signalx';

@Component({
  selector: 'app-root',
  imports: [JsonPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  public $counter = signal(0);
  public readonly increaseCounter = () =>
    this.$counter.update((curr) => ++curr);

  private readonly loaderResource = signalxResource<
    Response | null,
    { counter: number }
  >({
    request: () => ({ counter: this.$counter() }),
    filter: ({ counter }) => counter > 1,
    loader: () =>
      fetch('/assets/example.json').then((value) =>
        value.json().then((value) => value),
      ),
    defaultValue: null,
  });

  private readonly streamResource = signalxResource<
    string,
    { counter: number }
  >({
    request: () => ({ counter: this.$counter() }),
    filter: ({ counter }) => counter > 3,
    stream: () =>
      new Promise((resolve) => {
        const socket = new WebSocket('ws://localhost:9090');
        const messageSignal = signal({ value: '' });
        socket.onerror = (event) => {
          messageSignal.update((curr) => {
            return { value: 'Error with socket' };
          });

          resolve(messageSignal);
        };
      }),
    defaultValue: 'Default value',
  });

  public loaderValue = computed(() => this.loaderResource.value());
  public streamValue = computed(() => this.streamResource.value());

  public isLoaderLoading = computed(() => this.loaderResource.isLoading());
  public isStreamLoading = computed(() => this.streamResource.isLoading());
}
