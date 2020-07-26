/* 
  1. promise 是一个类，执行的时候传递一个执行器，执行器立即执行

  2. 有三种状态，pending、fulfilled、rejected
    pending -> fulfilled
    pending -> rejected 

    状态更改后就不会改变

  3. 使用resolve和reject函数更改状态

  4. then 方法内部判断状态，状态成功调用成功回调，状态失败调用失败回调。then是被定义在原型对象中。

  5. then成功回调有一个参数，表示成功的值，失败回调有一个参数，表示失败原因

  6. 处理异步，增加等待

  7.  then方法多次调用，将回调存储在数组中。then的链式调用，后面的then方法中的回调拿到的值是上一个then方法的回调函数的返回值

  8. 排除自身循环调用

  9. 捕获错误及then链式调用其他状态
*/

const PENDING = 'pending';
const FULFILLED = 'fufilled';
const REJECTED = 'rejected';

// 1. promise 是一个类，执行的时候传递一个执行器，执行器立即执行
class MyPromise {
  constructor(executor) {
    // 捕获执行器错误
    try {
      executor(this.resolve, this.reject);
    } catch (error) {
      this.reject(error);
    }
  }

  /*
    2. 有三种状态，pending、fulfilled、rejected
    pending -> fulfilled
    pending -> rejected 

    状态更改后就不会改变
  */
  // 默认是pending状态
  status = PENDING;
  // 成功的值
  value = undefined;
  // 失败的值
  reason = undefined;

  // 将成功与失败的回调存储起来，在等待结束后调用
  // 多次调用，回调以数组方式存储
  successCallback = [];
  failCallback = [];
  // 3. 使用resolve和reject函数更改状态
  // 执行成功的回调，并且更改status
  resolve = value => {
    // 状态只能更改一次
    if (this.status !== PENDING) return;
    this.status = FULFILLED;
    this.value = value;
    // 判断回调是否存在，存在调用
    // this.successCallback && this.successCallback(this.value);

    while (this.successCallback.length) {
      // 将最前面的回调弹出
      this.successCallback.shift()();
    }
  };

  // 执行失败的回调，并且更改status
  reject = reason => {
    // 状态只能更改一次
    if (this.status !== PENDING) return;
    this.status = REJECTED;
    this.reason = reason;
    // 判断回调是否存在，存在调用
    // this.failCallback && this.failCallback(this.reason);
    while (this.failCallback.length) {
      // 将最前面的回调弹出
      this.failCallback.shift()();
    }
  };

  then(successCallback, failCallback) {
    // 判断then是否传递了方法，如果没有传递，将上一个value传递下去
    successCallback = successCallback ? successCallback : value => value;
    failCallback = failCallback
      ? failCallback
      : reason => {
          throw reason;
        };
    // 首先要先返回一个promise，调用返回的新的promise的then
    let promise2 = new MyPromise((resolve, reject) => {
      if (this.status === FULFILLED) {
        // 将代码变为异步，确保promise2存在
        setTimeout(() => {
          // 捕获then中的resolve的错误
          try {
            let x = successCallback(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            // 捕获到错误后，传递给下一个promise的reject
            reject(error);
          }
        }, 0);
      } else if (this.status === REJECTED) {
        setTimeout(() => {
          // 捕获then中的reject的错误
          try {
            let x = failCallback(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            // 捕获到错误后，传递给下一个promise的reject
            reject(error);
          }
        }, 0);
        // let y = failCallback(this.reason);
      } else {
        // 等待状态，将回调暂存
        this.successCallback.push(() => {
          setTimeout(() => {
            // 捕获异步promise中的resolve错误
            try {
              let x = successCallback(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (error) {
              // 捕获到错误后，传递给下一个promise的reject
              reject(error);
            }
          }, 0);
        });
        this.failCallback.push(() => {
          setTimeout(() => {
            // 捕获异步promise中的reject错误
            try {
              let x = failCallback(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (error) {
              // 捕获到错误后，传递给下一个promise的reject
              reject(error);
            }
          }, 0);
        });
      }
    });
    return promise2;
  }

  /*
  promise all方法用来解决异步并发问题，允许按照异步代码调用的顺序来得到结果
  是一个静态方法，参数是一个数组
*/
  static all(arr) {
    let result = [];
    let index = 0;
    // 返回值是一个promise对象
    return new MyPromise((resolve, reject) => {
      function addData(key, value) {
        result[key] = value;
        index++;
        if (index === arr.length) {
          resolve(result);
        }
      }
      for (let i = 0; i < arr.length; i++) {
        let cur = arr[i];
        // 判断cur是普通值还是promise对象
        if (cur instanceof MyPromise) {
          // 如果是promise，执行cur的then方法，来处理成功or失败
          cur.then(
            val => addData(i, val),
            e => reject(e)
          );
        } else {
          // 普通值，直接放入数组
          addData(i, arr[i]);
        }
      }
    });
  }

  /* 
  promise resolve将给定的值转为promise对象，即返回一个包裹给定值的promise对象
*/
  static resolve(val) {
    if (val instanceof MyPromise) return val;

    return new MyPromise((resolve, reject) => {
      return resolve(val);
    });
  }

  /**
   *  promise finally方法始终会被执行，无论状态是成功还是失败
   *  可以在finally后调用then，得到返回结果
   */
  finally(callback) {
    // 得到当前promise的状态
    // 需要返回一个promise对象
    return this.then(
      val => {
        return MyPromise.resolve(callback()).then(() => val);
        // callback();
        // return val;
      },
      e => {
        return MyPromise.resolve(callback()).then(() => {
          throw e;
        });
        // callback();
        // throw e;
      }
    );
  }
  /**
   *  promise catch 处理当前promise最终状态为失败情况
   */
  catch(failCallback) {
    return this.then(undefined, failCallback);
  }
}

// 判断x是普通值还是promise对象
// 普通值直接调用resolve
// promise对象，需要查看promise对象返回的结果
// 根据promise对象返回的结果决定调用resolve，还是reject
function resolvePromise(promise2, x, resolve, reject) {
  // 排除循环调用错误，并输出错误原因
  if (promise2 === x) {
    return reject(
      new TypeError('Chaining cycle detected for promise #<Promise>')
    );
  }
  if (x instanceof MyPromise) {
    // promise 对象
    // x.then(value => resolve(value), reason => reject(reason))
    x.then(resolve, reject);
  } else {
    resolve(x);
  }
}

module.exports = MyPromise;
