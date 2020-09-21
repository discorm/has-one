# @disco/has-one

[![CI status](https://github.com/discorm/has-one/workflows/ci/badge.svg)](https://github.com/discorm/has-one/actions?query=workflow%3Aci+branch%3Amaster)
[![Coverage Status](https://coveralls.io/repos/discorm/has-one/badge.png)](https://coveralls.io/r/discorm/has-one)
[![npm package](https://img.shields.io/npm/v/@disco/has-one)](https://npmjs.com/package/@disco/has-one)
[![Dependencies](https://img.shields.io/david/discorm/has-one)](https://david-dm.org/discorm/has-one)
[![MIT License](https://img.shields.io/npm/l/@disco/has-one)](./LICENSE)

This is a middleware for disco to add has-one relation support.

## Install

```sh
npm install @disco/has-one
```

## Usage

```js
const disco = require('@disco/disco')
const hasOne = require('@disco/has-one')

const modeller = disco(driver)
modeller.use(hasOne)

const User = modeller.createModel('user')
const Profile = modeller.createModel('profile')

User.hasOne({
  model: Profile,
  as: 'profile'
})

const user = await User.create({
  email: 'me@example.com',
  password: 'badpassword'
})
user.profile.create({
  name: 'Stephen'
})
```

## HasOne API

### Model.hasOne(config : Object)
This is the entrypoint to create a hasOne relation on a given model.

* `config` {Object} config object
  * `model` {Model} Model this has one of
  * `as` {String} Name of relation property (default: model.tableName)
  * `foreignKey` {String} Column name of foreign key (default: Model.tableName)
  * `immutable` {Boolean} If it should exclude mutation APIs (default: false)

```js
User.hasOne({
  model: Profile,
  as: 'profile'
})

const user = User.findOne({})
user.posts // User.hasOne(...) added this relation property
```

Note that while a relation _can_ be set to `immutable`, this currently only makes the _relation_ immutable and not the model returned by it.

### Non-mutating

These APIs will always be included regardless of if `immutable` has been set to `false`.

#### relation.get() : Promise\<Model>

Get the related record.

```js
const profile = await user.profile.get()
```

### Mutating

If `immutable` has been set to `false` in `Model.hasOne(...)`, these APIs will not be included.

#### relation.set(model : Model) : Promise\<Model>

Set an existing model to this relation.

```js
const profile = Profile.build({
  name: 'Stephen'
})

await user.profile.set(profile)
```

#### relation.build(data : Object) : Model

Build a new related record. This will not persist until the returned model is saved.

```js
const profile = user.profile.build({
  name: 'Stephen'
})
await profile.save()
```

#### relation.create(data : Object) : Promise\<Model>

Create a new related record. This will persist before returning the model.

```js
const profile = await user.profile.create({
  name: 'Stephen'
})
```

#### relation.getOrCreate(data : Object) : Promise\<Model>

Attempt to get the related record, creating it with the given `data` if not found.

```js
const profile = await user.profile.getOrCreate({
  name: 'Stephen'
})
```

#### relation.createOrUpdate(changes : Object) : Promise\<Model>

Attempt to update the related record by applying the given `changes`, creating it with the `changes` if not found.

```js
const profile = await user.profile.createOrUpdate({
  name: 'Stephen'
})
```

#### relation.update(changes : Object) : Promise\<Model>

Update the related record by applying the given `changes`.

```js
const profile = await user.profile.update({
  name: 'Stephen'
})
```

#### relation.remove() : Promise\<Model>

Remove the related record.

```js
const removedProfile = await user.profile.remove({
  name: 'Stephen'
})
```
