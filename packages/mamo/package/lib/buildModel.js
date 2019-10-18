// A Mathematical Model. Provides auto-solving capabilities
// for mathematical relations, rather than having to write
// every possible combination of properties.
function buildModel(opts) {
  const model = {}
  for (key in opts) { assign(model, key, opts[key]) }

  Object.defineProperty(model, "_computeStack", {
    enumerable: false,
    value: []
  })

  model.where = (moreOpts) => {
    const fullOpts = Object.assign(opts, moreOpts)
    return buildModel(fullOpts)
  }

  return model
}

// Sets model[key] to either:
// - value, if value is not a function
// - a getter that executes value(), if value is a function.
function assign(model, key, value) {

  // If we don't have a function,
  // life is easy...
  if (typeof value !== "function") {
    model[key] = value
    return model
  }

  // Otherwise,
  // define a getter/setter that calls the given function.
  Object.defineProperty(model, key, {
    enumerable: true,
    get: () => {

      // We need to avoid infinite loops.
      // This is done by keeping track of what's been asked for,
      // and throwing if we ever ask for the same thing
      // twice in a computation.
      if (model._computeStack.indexOf(key) !== -1) {
        throw new Error(`${key} is not computable.`)
      }

      // We use the stack to keep track of what we're computing.
      model._computeStack.push(key)
      const result = value.apply(model)
      model._computeStack.pop()
      return result
    },

    set: (value) => {
      Object.defineProperty(model, key, {
        enumerable: true,
        value
      })
    }
  })

  return model
}

module.exports = buildModel
