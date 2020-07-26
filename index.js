const MyPromise = require('./promise');

let promise = new Promise((resolve, reject) => {
  resolve('成功');
});

// then方法示例
promise.then(
  val => {
    console.log(1);
  },
  e => {
    console.log(e);
  }
);
// 多个promise执行示例
promise.then(
  val => {
    console.log(2);
  },
  e => {
    console.log(e);
  }
);

function other() {
  return new MyPromise((resolve, reject) => {
    resolve('other');
  });
}

// then链式调用示例
promise
  .then(val => {
    return other();
  })
  .then(val => {
    console.log(val);
  });

// 循环调用错误示例
let p1 = promise.then(val => {
  console.log('p1');
  return p1;
});
p1.then(
  val => {
    console.log(val);
  },
  e => {
    console.log(e.message);
  }
);

// 执行器错误捕获
let p2 = new MyPromise((resolve, reject) => {
  throw new Error('executor error');
  resolve('p2 success');
});

p2.then(
  val => {
    console.log(val);
  },
  e => {
    console.log(e.message);
  }
);

//  then中 resolve错误捕获
let p3 = new MyPromise((resolve, reject) => {
  resolve('p3 success');
});

p3.then(
  val => {
    console.log(val);
    throw new Error('then error');
  },
  e => {
    console.log(e.message);
  }
).then(
  val => {
    console.log(val);
  },
  e => {
    console.log('捕获了上一个then的error');
    console.log(e.message);
  }
);

//  then中 reject错误捕获
let p4 = new MyPromise((resolve, reject) => {
  reject('p4 fail');
});

p4.then(
  val => {
    console.log(val);
  },
  e => {
    console.log(e);
    return 'come from p4 error';
  }
).then(
  val => {
    console.log(val);
  },
  e => {
    console.log(e.message);
  }
);

// 异步promise错误捕获
let p5 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('p5 执行了');
  }, 2000);
});

p5.then(
  val => {
    console.log(val);
    return 'p5 resolve';
    // throw new Error('async then error');
  },
  e => {
    console.log(e);
  }
).then(val => {
  console.log(val);
});

// then方法参数变成可选参数
let p6 = new MyPromise((resolve, reject) => {
  // resolve('then方法参数可选成功');
  reject('then方法参数可选失败');
});

p6.then()
  .then()
  .then(
    val => console.log(val),
    e => console.log(e)
  );

// all方法示例
function p7() {
  return new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve('p7');
    }, 2000);
  });
}

function p8() {
  return new MyPromise((resolve, reject) => {
    resolve('p8');
  });
}

MyPromise.all(['a', 'b', p7(), p8(), 'c']).then(val => {
  console.log(val);
});

// resolve示例
MyPromise.resolve(10).then(val => console.log(val));
MyPromise.resolve(p8()).then(val => console.log(val));

let p9 = new MyPromise((resolve, reject) => {
  // resolve('p9 resolve');
  reject('p9 reject');
});

// finally
p9.finally(() => {
  console.log('finally');
  return p7();
}).then(
  val => console.log(val),
  e => console.log(e)
);

// catch
p9.then(val => console.log(val)).catch(e => console.log(e));
