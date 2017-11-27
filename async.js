'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 */

function runParallel(jobs, parallelNum, timeout = 1000) {
    if (jobs.length === 0) {
        return Promise.resolve([]);
    }
    let jobsWithIndex = jobs.map((job, ind) => ({ ind: ind, job: job }));

    let translates = [];

    let counterExecutedJobs = 0;

    const startingSeries = jobsWithIndex.splice(0, parallelNum);

    const getPromise = job => new Promise(resolve => {
        job().then(resolve, resolve);
        setTimeout(() => resolve(new Error('Promise timeout')), timeout);
    });

    const handler = (translate, ind, resolve) => {
        translates[ind] = translate;
        counterExecutedJobs++;
        if (counterExecutedJobs === jobs.length) {
            resolve(translates);
        }
        if (jobsWithIndex.length > 0) {
            let jobAndIndex = jobsWithIndex.shift();

            getPromise(jobAndIndex.job).then(data => handler(data, jobAndIndex.ind, resolve));
        }
    };

    return new Promise(resolve => {
        startingSeries.forEach(jobAndIndex => {
            getPromise(jobAndIndex.job).then(data => handler(data, jobAndIndex.ind, resolve));
        });
    });
}
