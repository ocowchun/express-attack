function middleware(argument) {
  return async function(req, res, next){
    next()
  }
}

module.exports = middleware