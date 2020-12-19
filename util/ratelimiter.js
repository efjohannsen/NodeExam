//importerer rate limit modul.
const rateLimiter = require("express-rate-limit");

const authLimiter = rateLimiter({
    windowMs: 10 * 60 * 1000, //10 minutter.
    max: 100 //max antal forsøg pr. windowMs.
});

//eksporterer authLimiter til brug i app.js.
module.exports = authLimiter;