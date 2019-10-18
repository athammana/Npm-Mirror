const expect = require("chai").expect

const buildModel = require("./buildModel")

describe("buildModel", () => {

  let model

  beforeEach(() => {

    model = buildModel({
      result: function() {
        return this.product - this.sum
      },

      sum: function() {
        return (this.a + this.b)
        || (this.product - this.result)
      },

      product: function() {
        return (this.a * this.b)
          || (this.result + this.sum)
      },

      b: function() { return this.a + 1 }
    })

    model = model.where({
      a: 3,
      b: 2
    })
  })

  it("can return constants that have been defined", () => {
    expect(model.a).to.equal(3)
    expect(model.b).to.equal(2)
  })

  it("can return computed definitions", () => {
    expect(model.product).to.equal(6)
    expect(model.sum).to.equal(5)
  })

  it("can return computed definitions, which require further computed definitions", () => {
    expect(model.result).to.equal(1)
  })

})
