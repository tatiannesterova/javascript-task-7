'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

function getPromise(job, timeout) {
    return new Promise(resolve => {
        job().then(resolve, resolve);
        setTimeout(() => resolve(new Error('Promise timeout')), timeout);
    });
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
    const results = [];

    let counterExecutedJobs = 0;

    const startingSeries = jobs.slice(0, parallelNum);

    let nextJob = parallelNum;

    function runJob(job, index, resolve) {
        getPromise(job, timeout).then(data => handler(data, index, resolve));
    }

    function handler(data, index, resolve) {
        results[index] = data;
        counterExecutedJobs++;
        if (counterExecutedJobs === jobs.length) {
            resolve(results);
        }
        if (nextJob < jobs.length) {
            const currentJob = nextJob;

            nextJob++;
            runJob(jobs[currentJob], currentJob, resolve);
        }
    }

    return new Promise(resolve => {
        startingSeries.forEach((job, index) => {
            runJob(job, index, resolve);
        });
    });
}
