//importerer rate limit modul.
const rateLimiter = require("express-rate-limit");

const authLimiter = rateLimiter({
    windowMs: 10 * 60 * 1000, //10 minutter.
    max: 10 //max antal forsøg pr. windowMs.
});

module.exports = authLimiter;