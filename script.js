class Game {
  constructor (field, btn, score, msg) {
    this.field = field;
    this.score = score;
    btn.addEventListener('click', () => this.restart());
    this.msg = msg;    

    this.items = [];
    this.active = true;
    this.startTime = undefined;
    this.records = [];

    this.touchStartX = undefined;
    this.touchStartY = undefined;

    this.limit = Math.round(this.field.offsetWidth / 8);
    window.addEventListener('resize', () => this.limit = Math.round(this.field.offsetWidth / 8));

    for (let i = 0; i < 25; i++) {
      this.items.push({
        id: false,
        value: false,
        index: i
      })
    }

    document.body.addEventListener('keydown', event => {
      event.preventDefault();
      if (this.active) {
        if (event.key === 'ArrowUp') this.move('top');
        else if (event.key === 'ArrowRight') this.move('right');
        else if (event.key === 'ArrowDown') this.move('down');
        else if (event.key === 'ArrowLeft') this.move('left');
      }
    });

    this.field.addEventListener('touchstart', event => {
      this.touchStartX = event.changedTouches[0].clientX;
      this.touchStartY = event.changedTouches[0].clientY;
    });

    this.field.addEventListener('touchmove', event => {
      event.preventDefault();
      if (this.active) {
        if (event.changedTouches[0].clientX - this.touchStartX < -50) this.move('left');
        else if (event.changedTouches[0].clientX - this.touchStartX > 50) this.move('right');
        else if (event.changedTouches[0].clientY - this.touchStartY < -50) this.move('top');
        else if (event.changedTouches[0].clientY - this.touchStartY > 50) this.move('down');
      }
    });

    this.field.addEventListener('touchend', () => this.touchStartX = this.touchStartY = undefined);

    setTimeout(() => this.createItem());
    this.createItem();
  }





  createItem() {
    const emptyCells = this.items.filter(item => !item.id);
  
    if (emptyCells.length) {
      const index = Math.floor(Math.random() * emptyCells.length);

      let item = this.items[emptyCells[index].index];
      item.value = (Math.floor(Math.random() * 10) === 9) ? 4 : 2;
      item.id = 'i' + Date.now();

      this.field.insertAdjacentHTML('beforeend', `<li class="item n${item.value}" id="${item.id}">${item.value}</li>`);
      this.setPosition(item);
    }
  }



  move(dir) {
    this.active = false;

    if (!this.startTime) this.startTime = Date.now();

    for (let line = 0; line < 5; line++) {
      const current =
        (dir === 'top') ? this.items.filter((i, index) => index % 5 === line) :
          (dir === 'down') ? this.items.filter((i, index) => index % 5 === line).reverse() :
            (dir === 'left') ? this.items.filter((i, index) => Math.floor(index / 5) === line) :
              (dir === 'right') ? this.items.filter((i, index) => Math.floor(index / 5) === line).reverse() : [];

      const result = current.filter(item => item.id !== false);

      for (let i = result.length - 1; i > 0; i--) {
        let last = result[i];
        let prev = result[i - 1];

        if (last.value === prev.value) {
          this.increase(this.items[prev.index]);
          this.removeItem(this.items[last.index]);
          result.splice(i, 1);
          i -= 1;
        }
      }

      current.forEach((i, n) => {
        this.items[current[n].index].id = (result[n]) ? result[n].id : false;
        this.items[current[n].index].value = (result[n]) ? result[n].value : false;
      });

      current.filter(item => item.id !== false).forEach(item => this.setPosition(item));
    }

    setTimeout(() => {
      this.createItem();
      this.active = true;
    }, 250);
  }



  increase(item) {
    let elem = document.getElementById(item.id);
    elem.textContent = item.value *= 2;

    elem.classList.add('n' + item.value);
    elem.classList.remove('n' + item.value / 2);
 
    this.score.textContent = +this.score.textContent + item.value;
    if (+item.value >= 2048) this.record();
  }



  restart() {
    this.items
      .filter(item => item.id !== false)
      .forEach(item => this.removeItem(this.items[item.index]));

    this.score.textContent = 0;

    setTimeout(() => this.createItem());
    this.createItem();

    this.msg.hidden = this.active = true;
  }



  record() {
    let list = document.getElementById('records');

    while (list.lastElementChild !== null) {
      list.lastElementChild.remove();
    }

    const diff = Math.round((Date.now() - this.startTime) / 1000);
    const str = Math.floor(diff / 60).toString().padStart(2, 0) + ':' + Math.floor(diff % 60).toString().padStart(2, 0);

    this.records.push( {diff, str} );
    this.records.sort((a, b) => a.diff - b.diff);

    this.records.forEach(item => list.insertAdjacentHTML('beforeend', `<li>${item.str}</li>`));

    this.msg.hidden = this.startTime = false;
    setTimeout(() => this.active = false, 300);
  }



  setPosition(item) {
    let elem = document.getElementById(item.id);
    elem.style.left = Math.round(item.index % 5 * 192) / 10 + 4 + '%';
    elem.style.top = Math.round(Math.floor(item.index / 5) * 192) / 10 + 4 + '%';
  }



  removeItem(item) {
    document.getElementById(item.id).remove();
    item.id = item.value = false;
  }
}





let g = new Game(
  document.getElementById('list'),
  document.getElementById('restart'),
  document.getElementById('score'),
  document.getElementById('win')
);