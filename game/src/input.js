// Ember Vault — keyboard and mouse input, with one-shot presses that never drop.
export class Input {
  constructor(canvas) {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.sneak = false;
    this.pressed = {}; // one-shot actions, consumed by the game loop
    this.mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      this.setKey(e.key, true);
      if (!e.repeat) {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') this.pressed.pause = true;
        if (e.key === 'Enter' || e.key === ' ') this.pressed.confirm = true;
        if (e.key === 'r' || e.key === 'R') this.pressed.restart = true;
        if (e.key === 'm' || e.key === 'M') this.pressed.mute = true;
      }
    });
    window.addEventListener('keyup', (e) => this.setKey(e.key, false));
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    });
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.mouse.clicked = true;
      this.pressed.confirm = true;
    });
    window.addEventListener('blur', () => {
      this.up = this.down = this.left = this.right = this.sneak = false;
    });
  }

  setKey(key, down) {
    if (key === 'w' || key === 'W' || key === 'ArrowUp') this.up = down;
    if (key === 's' || key === 'S' || key === 'ArrowDown') this.down = down;
    if (key === 'a' || key === 'A' || key === 'ArrowLeft') this.left = down;
    if (key === 'd' || key === 'D' || key === 'ArrowRight') this.right = down;
    if (key === 'Shift') this.sneak = down;
  }

  // Take and clear one-shot presses for this frame.
  takePressed() {
    const out = this.pressed;
    this.pressed = {};
    return out;
  }

  takeClick() {
    if (!this.mouse.clicked) return null;
    this.mouse.clicked = false;
    return { x: this.mouse.clickX, y: this.mouse.clickY };
  }
}
