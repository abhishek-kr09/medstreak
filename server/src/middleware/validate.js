const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: result.error.flatten()
    });
  }

  req[source] = result.data;
  return next();
};

module.exports = { validate };
