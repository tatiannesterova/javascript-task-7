'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

function getPromise(job, timeout) {
    return function () {
        return new Promise((resolve, reject) => {
            job().then(resolve, reject);
            setTimeout(() => reject(new Error('Promise timeout')), timeout);
        });
    };
}

function getListTranslates(translates) {
    return translates.reduce((results, translate) => {
        results[translate.ind] = translate.data;

        return results;
    }, []);
}

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 */

function runParallel(jobs, parallelNum, timeout = 1000) {
    if (jobs.length === 0) {
        return Promise.resolve([]);
    }
    let promises = jobs.map((job, ind) => {
        return { ind: ind, function: getPromise(job, timeout) };
    });

    let translates = [];

    const amountJobs = promises.length;

    const startingSeries = promises.splice(0, parallelNum);

    const handler = function (translate, ind, resolve) {
        translates.push({ ind: ind, data: translate });
        if (promises.length > 0) {
            let promise = promises.shift();

            promise.function()
                .then(data => handler(data, promise.ind, resolve),
                    err => handler(err, promise.ind, resolve));
        }
        if (translates.length === amountJobs) {
            resolve(getListTranslates(translates));
        }
    };

    return new Promise(resolve => {
        startingSeries.forEach(promise => {
            promise.function()
                .then(data => handler(data, promise.ind, resolve),
                    err => handler(err, promise.ind, resolve));
        });
    });
}
