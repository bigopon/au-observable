import { fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';

export class MyApp {
  public message = 'Hello World!';

  obs$ = fromEvent(document, 'click').pipe(map((e: MouseEvent, index) => {
    console.log(`${e.x}, ${e.y} index`);
    return { x: e.x, y: e.y, i: index };
  }));

  obs2 = this.obs$.subscribe(v => {
    console.log('obs2', v);
  })
};
