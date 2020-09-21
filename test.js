'use strict'

const isSubset = require('is-subset')
const tap = require('tap')

const disco = require('@disco/disco')
const { BaseModel } = require('@disco/base-driver')
const hasOne = require('./')
const {
  HasOne,
  HasOneMutable
} = hasOne

function hasRelation (t, obj, meth, relation) {
  t.ok(
    obj.prototype[meth] instanceof relation,
    `"${meth}" getter is instance of ${relation.name}`
  )
}

function driver () {
  return class Model extends BaseModel {
    static reset (records = []) {
      this.hooks = []
      this.data = []

      for (const record of records) {
        this._add(record)
      }
    }

    static _add (data) {
      const { length } = this.data
      const record = { id: length + 1, ...data }
      this.data.push(record)
      return record
    }

    emit (event) {
      this.constructor.hooks.push(event)
    }

    _fetch () {
      return this.constructor.data.filter(v => v.id === this.id)[0]
    }

    _save () {
      return this.constructor._add(this)
    }

    _update () {
      const record = this.constructor.data
        .filter(model => model.id === this.id)

      Object.assign(record[0], this)
      return this._fetch()
    }

    _remove () {
      this.constructor.data = this.constructor.data
        .filter(model => model.id !== this.id)
    }

    static async * findIterator (query) {
      const items = this.data
        .filter(v => isSubset(v, query))

      for (const item of items) {
        yield this.build(item)
      }
    }
  }
}

tap.test('HasOne', async t => {
  const modeller = disco(driver())
  modeller.use(hasOne)

  const Parent = modeller.createModel('parent')
  const Child = modeller.createModel('child')

  Parent.reset()
  Child.reset()

  Parent.hasOne({
    model: Child,
    as: 'sub',
    foreignKey: 'owner_id',
    immutable: true
  })
  hasRelation(t, Parent, 'sub', HasOne)

  const parent = await Parent.create({
    name: 'this is a parent'
  })

  t.test('get', async t => {
    Child.reset([
      { name: 'get', owner_id: parent.id }
    ])

    const child = await parent.sub.get()
    t.ok(child.id)
    t.equal(child.name, 'get')
    t.equal(child.owner_id, parent.id)

    Child.reset()

    t.notOk(await parent.sub.get())
  })

  t.end()
})

tap.test('HasOneMutable', async t => {
  const modeller = disco(driver())
  modeller.use(hasOne)

  const Parent = modeller.createModel('parent')
  const Child = modeller.createModel('child')

  Parent.reset()
  Child.reset()

  Parent.hasOne({
    model: Child
  })
  hasRelation(t, Parent, 'child', HasOneMutable)

  const parent = await Parent.create({
    name: 'this is a parent'
  })

  t.test('build', async t => {
    Child.reset()

    const child = parent.child.build({
      name: 'build'
    })

    t.notOk(child.id)
    t.equal(child.name, 'build')
    t.equal(child.parent_id, parent.id)

    t.deepEqual(Child.data, [])
  })

  t.test('getOrCreate', async t => {
    Child.reset()

    let i
    for (i = 0; i < 2; i++) {
      const child = await parent.child.getOrCreate({
        name: 'getOrCreate'
      })

      t.ok(child.id)
      t.equal(child.name, 'getOrCreate')
      t.equal(child.parent_id, parent.id)

      t.deepEqual(Child.data, [
        { id: 1, name: 'getOrCreate', parent_id: parent.id }
      ])
    }

    t.equal(i, 2)
  })

  t.test('create', async t => {
    Child.reset()

    const child = await parent.child.create({
      name: 'create'
    })

    t.ok(child.id)
    t.equal(child.name, 'create')
    t.equal(child.parent_id, parent.id)

    t.deepEqual(Child.data, [
      { id: 1, name: 'create', parent_id: parent.id }
    ])
  })

  t.test('createOrUpdate', async t => {
    Child.reset()

    let i
    for (i = 0; i < 2; i++) {
      const child = await parent.child.createOrUpdate({
        name: `createOrUpdate ${i}`
      })

      t.ok(child.id)
      t.equal(child.name, `createOrUpdate ${i}`)
      t.equal(child.parent_id, parent.id)

      t.deepEqual(Child.data, [
        { id: 1, name: `createOrUpdate ${i}`, parent_id: parent.id }
      ])
    }

    t.equal(i, 2)
  })

  t.test('update', async t => {
    Child.reset([
      { name: 'update', parent_id: parent.id }
    ])

    const child = await parent.child.update({
      name: 'updated'
    })

    t.ok(child.id)
    t.equal(child.name, 'updated')
    t.equal(child.parent_id, parent.id)

    t.deepEqual(Child.data, [
      { id: 1, name: 'updated', parent_id: parent.id }
    ])
  })

  t.test('remove', async t => {
    Child.reset([
      { name: 'remove', parent_id: parent.id }
    ])

    const child = await parent.child.remove()

    t.notOk(child.id)
    t.equal(child.name, 'remove')
    t.equal(child.parent_id, parent.id)

    t.deepEqual(Child.data, [])
  })

  t.test('set', async t => {
    Child.reset()

    const child = Child.build({
      name: 'set'
    })
    await parent.child.set(child)

    t.ok(child.id)
    t.equal(child.name, 'set')
    t.equal(child.parent_id, parent.id)

    t.deepEqual(Child.data, [
      { id: 1, name: 'set', parent_id: parent.id }
    ])
  })

  t.end()
})
