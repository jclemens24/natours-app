// REVIEW: Accepts tourController function block, catches error if
// thrown

module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => next(err));
  };
};
