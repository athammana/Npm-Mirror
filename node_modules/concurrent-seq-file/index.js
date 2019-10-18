var Sf = require('seq-file')

module.exports = function (file, options) {
    options = options||{}

    var sf = new Sf(file, options)
    patchSeq(sf)
    var saveValue = sf.readSync()

    // if seq is 0 strings that start with 0 are always false when compared to it.
    // https://github.com/npm/seq-file/pull/7
    if(sf.seq == 0) sf.seq = ''

    options.savedValue = saveValue||0
    var start = module.exports.starter(function(toSave,cb){
      // save the new sequence via seq-file
      save(sf, toSave, cb)
    },options)

    start.value = saveValue
    return start
}

module.exports.starter = function(persist,options) {
  
  options = options || {}

  var saveValue = options.savedValue||0
  var delay = options.delay || 1000
  var started = {}
  var dones = {}
  var saving = false
  var saveQ = false

  return function startSequence (seq, opts) {
    started[seq] = seq
    return function (cb) {
      delete started[seq]
      var startedSeq = least(started)

      if (dones[seq]) {
        var msg = "shouldn't 'done' the same sequence id more than once concurrently"
        if(cb) cb(new Error(msg))
        else console.warn(msg)
        return
      }
      dones[seq] = {cb:cb, seq:seq}

      // always save the highest number in the dones that's less than the lowest number in the actives
      var endSeq = ''
      var cbs = []
      // sort
      Object.keys(dones).sort().forEach(function (k) {
        if (!startedSeq || (dones[k].seq < startedSeq && endSeq <= dones[k].seq)) {
          endSeq = dones[k].seq
          cbs.push(dones[k].cb)
          delete dones[k]
        }
      })

      if (!endSeq || endSeq === saveValue) {
        return unroll(false, saveValue, cbs)
      }

      saveValue = endSeq

      if (!saveQ) saveQ = []
      // im either already waiting or my save loop is idle and the implementor has not yet completed the lowest started sequence
      if (saving || !saveValue) {
        return saveQ.push.apply(saveQ, cbs)
      }
      
      saveLoop(cbs)

      function saveLoop (cbs) {
        saving = true

        var savedValue = saveValue
        persist(savedValue, function (err){
          startSequence.value = savedValue
          
          unroll(err, savedValue, cbs)
          setTimeout(function () {
            saving = false
            if (saveQ.length) {
              cbs = saveQ
              saveQ = []
              saveLoop(cbs)
            }
          }, delay)
        })
      }
    }
  }
}

function save (sf, seq, cb) {
  sf.savecbs.push(function (err) {
    if (cb) cb(err)
  })
  sf.save(seq)
}

function patchSeq (sf) {
  if (sf.savecbs) return
  sf.savecbs = []
  var ofinish = sf.onFinish
  sf.onFinish = function (err) {
    ofinish.apply(this, arguments)
    var cbs = sf.savecbs
    sf.savecbs = []
    if (cbs) while (cbs.length) cbs.shift()(err)
  }
}

function least (obj) {
  var v = ''
  Object.keys(obj).forEach(function (k) {
    k = obj[k]
    if (!v || v > k) v = k
  })
  return v
}

function unroll (err, data, cbs) {
  var cb
  while (cbs.length) {
    cb = cbs.shift()
    if(cb) cb(err, data)
  }
}

function noop () {}
