const setCache = function (req, res, next) {

  if (req.method === "GET") {
    res.set("Cache-control", `no-cache`);
  } else {
    res.set("Cache-control", `no-store`);
  }

  next();
};

module.exports = setCache;
