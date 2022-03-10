class Game {
  constructor (field, btn, score, msg) {
    this.field = field;  // ну поле и поле
    this.score = score;  // <p> со счётом
    btn.addEventListener('click', () => this.restart());  // кнопка new game
    this.msg = msg;  // плашка WIN

    this.items = [];  // данные по каждой клетке, главное
    this.active = true;  // становится false на время перемещения клеток, либо при победе - не реагирует на кнопки и свайпы
    this.startTime = undefined;  // timestamp от которой идёт отсчёт потраченного времени
    this.records = [];  // массив объектов { diff: timestamp, str: "01:23" }

    this.touchStartX = undefined;  // координаты touchstart
    this.touchStartY = undefined;  // для мобилок

    this.limit = Math.round(this.field.offsetWidth / 8);  // длина свайпа, необходимого для переключения - 1/8 ширины (или высоты) поля
    window.addEventListener('resize', () => this.limit = Math.round(this.field.offsetWidth / 8));  // обновляет его на resize

    for (let i = 0; i < 25; i++) {  // суть, в items хранится инфа по каждой клетке поля, не созданному элементу, а именно клетке
      this.items.push({  // клетки пронумерованы построчно, 1 строка с 0 по 4, 2 строка с 5 по 9 и тд
        id: false,  // если клетка пустая тут false, если заполнена - id элемента в этой клетке
        value: false,  // клетка пустая - false, клетка заполнена - её номинал, умножается вместе с числом в элементе
        index: i  // value пришлось вставить, чтобы было проще складывать соседние элементы
      })  // очень нужный index не меняется и из него вычисляется положение элемента на поле, и задается в инлайн стилях
    }  // через абсолютное позиционирование, подробнее (нет) в setPosition()

    document.body.addEventListener('keydown', event => {
      event.preventDefault();  // отключает прокрутку страницы стрелками
      if (this.active) {  // не сработает если элементы двигаются, или игра окончена
        if (event.key === 'ArrowUp') this.move('top');
        else if (event.key === 'ArrowRight') this.move('right');
        else if (event.key === 'ArrowDown') this.move('down');
        else if (event.key === 'ArrowLeft') this.move('left');
      }
    });

    this.field.addEventListener('touchstart', event => {
      this.touchStartX = event.changedTouches[0].clientX;
      this.touchStartY = event.changedTouches[0].clientY;
    });  // сохраняется позиция touchstart, от неё отслеживается направление свайпа

    this.field.addEventListener('touchmove', event => {  // вот тут
      event.preventDefault();  // отключает прокрутку страницы если свайпать по полю
      if (this.active) {
        if (event.changedTouches[0].clientX - this.touchStartX < -50) this.move('left');
        else if (event.changedTouches[0].clientX - this.touchStartX > 50) this.move('right');
        else if (event.changedTouches[0].clientY - this.touchStartY < -50) this.move('top');
        else if (event.changedTouches[0].clientY - this.touchStartY > 50) this.move('down');
      }
    });

    this.field.addEventListener('touchend', () => this.touchStartX = this.touchStartY = undefined);

    setTimeout(() => this.createItem());
    this.createItem();  // наполняет поле
  }


  // game over отсутствует, надеюсь на вашу сообразительность


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
  // сначала создёт массив со всеми пустыми клетками, если их нет, элемент не создаёт (внезапно)
  // например получился emptyCells с тремя обьектами: [ { index: 5 }, { index: 14 }, { index: 22 } ] - id и value - false во всех

  // рандом выдал напрмер 0, emptyCells[0] = { index: 5 }, то есть this.item[emptyCells[index].index] === this.items[5]
  // дальше очевидно сохраняет туда id элемента, номинал и создаёт сам элемент на поле, для всего этого сохранял index
  // каждому номиналу свой класс: 'n' + номинал, .n2 .n16 .n128 etc


  move(dir) {
    this.active = false;  // отрубает кнопки на время выполнения и transition

    if (!this.startTime) this.startTime = Date.now();  // на первом ходу начинает отсчёт

    for (let line = 0; line < 5; line++) {  // распишу снизу
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
  // перемещения по вертикали считаются по колонкам, по горизонтали - по строкам, например движение вверх, первая колонка, _ 2 _ 2 2

  // current: [                                   result: [                              на выходе: [
  //   { id: false, value: false, index: 0  },      { id: 'a', value: 2, index: 5  },      { id: 'a',   value: 2,     index: 0  },
  //   { id: 'a',   value: 2,     index: 5  },      { id: 'b', value: 2, index: 15 },      { id: 'b',   value: 4,     index: 5  },
  //   { id: false, value: false, index: 10 },      { id: 'c', value: 2, index: 20 }       { id: false, value: false, index: 10 },
  //   { id: 'b',   value: 2,     index: 15 },    ]                                        { id: false, value: false, index: 15 },
  //   { id: 'c',   value: 2,     index: 20 }                                              { id: false, value: false, index: 20 }
  // ]                                                                                   ]

  // через последний массив расставляются новые позиции элементам



  increase(item) {  // собственно удваивает номинал элемента
    let elem = document.getElementById(item.id);
    elem.textContent = item.value *= 2;  // и this.items[какой-то индекс].value

    elem.classList.add('n' + item.value);  // элемент номинала 2 == .n2, номинала 16 == .n16, номинала 256 == .n256  итд
    elem.classList.remove('n' + item.value / 2);
 
    this.score.textContent = +this.score.textContent + item.value;  // обновляет счёт
    if (+item.value >= 2048) this.record();  // победа, показать плашку ШИН, всё заблочить (уже и не пойму как), добавить рекорд
  }



  restart() {
    this.items.filter(item => item.id).forEach(item => this.removeItem(this.items[item.index]));  // удаляет все элементы с поля

    this.score.textContent = 0;  // обнулить счёт

    setTimeout(() => this.createItem());
    this.createItem();  // наполнить поле

    this.msg.hidden = this.active = true;  // убрать плашку ШИН, снять блок
  }



  record() {
    let list = document.getElementById('records');

    while (list.lastElementChild !== null) {  // очищает список рекордов
      list.lastElementChild.remove();
    }

    const diff = Math.round((Date.now() - this.startTime) / 1000);
    const str = Math.floor(diff / 60).toString().padStart(2, 0) + ':' + Math.floor(diff % 60).toString().padStart(2, 0);

    this.records.push( {diff, str} );  // закинуть новый рекорд в массив, отсортировать, не уверен, что работает
    this.records.sort((a, b) => a.diff - b.diff);

    this.records.forEach(item => list.insertAdjacentHTML('beforeend', `<li>${item.str}</li>`));  // наполняет список заново

    this.msg.hidden = this.startTime = false;  // снять плашку ШИН, сбросить счётчик, снять блок
    setTimeout(() => this.active = false, 300);
  }



  setPosition(item) {
    let elem = document.getElementById(item.id);  // элементы расставляются через абсолютное позиционирование (прямо в инлайн), индексы от 0 до 24
    elem.style.left = Math.round(item.index % 5 * 192) / 10 + 4 + '%';  // каждый элемент - квадрат со стороной 15.2%
    elem.style.top = Math.round(Math.floor(item.index / 5) * 192) / 10 + 4 + '%';  // отступы между элементами и паддинги поля по 4%
  }



  removeItem(item) {  // убирает элемент с поля и из this.items
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