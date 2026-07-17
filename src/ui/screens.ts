export type ScreenName = 'menu' | 'help' | 'game';

export type ScreenElements = Readonly<Record<ScreenName, HTMLElement>>;

export class Screens {
  private readonly elements: ScreenElements;
  private current: ScreenName | null = null;

  constructor(elements: ScreenElements) {
    this.elements = elements;
  }

  get active(): ScreenName | null {
    return this.current;
  }

  show(name: ScreenName): void {
    (Object.keys(this.elements) as ScreenName[]).forEach((key) => {
      this.elements[key].hidden = key !== name;
    });
    this.current = name;

    // Move focus into the newly shown screen so keyboard/screen-reader users
    // land somewhere sensible instead of on a now-hidden element.
    const heading = this.elements[name].querySelector<HTMLElement>('[data-screen-focus]');
    heading?.focus();
  }
}
