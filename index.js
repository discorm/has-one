'use strict'

class HasOne {
  constructor (foreignKey, instance, model) {
    this.foreignKey = foreignKey
    this.instance = instance
    this.model = model
  }

  get () {
    return this.model.findOne(
      modelQuery(this)
    )
  }
}

class HasOneMutable extends HasOne {
  set (item) {
    const { foreignKey, instance } = this
    item[foreignKey] = instance.id
    return item.save()
  }

  build (data) {
    return this.model.build(
      bindToModel(this, data)
    )
  }

  getOrCreate (data) {
    return this.model.findOrCreate(
      modelQuery(this),
      data
    )
  }

  create (data) {
    return this.model.create(
      bindToModel(this, data)
    )
  }

  createOrUpdate (data) {
    return this.model.createOrUpdate(
      modelQuery(this),
      data
    )
  }

  update (data) {
    return this.model.updateOne(
      modelQuery(this),
      data
    )
  }

  remove () {
    return this.model.removeOne(
      modelQuery(this)
    )
  }
}

function bindToModel (model, query) {
  return Object.assign({}, query, modelQuery(model))
}

function modelQuery ({ foreignKey, instance }) {
  return { [foreignKey]: instance.id }
}

function addHasOne (BaseModel) {
  Object.defineProperty(BaseModel, 'hasOne', {
    value: function hasOne ({
      model,
      as = model.tableName,
      foreignKey = `${this.tableName}_id`,
      immutable = false
    }) {
      const Factory = immutable ? HasOne : HasOneMutable
      Object.defineProperty(this.prototype, as, {
        get () {
          return new Factory(foreignKey, this, model)
        }
      })
    }
  })

  return BaseModel
}

function middleware () {
  this.driver = addHasOne(this.driver)
}

middleware.addHasOne = addHasOne
middleware.HasOne = HasOne
middleware.HasOneMutable = HasOneMutable

module.exports = middleware
