var test = require('tape')
var fs = require('fs')
var seqFile = require('../')

test('can',function(t){
  t.plan(4)

  if(fs.exists(__dirname+'/.test2'))
    fs.unlinkSync(__dirname+'/.test2')

  var seq = seqFile(__dirname+'/.test2',{delay:1000})
  
  var done1 = seq('1-1')

  var done2 = seq('1-2')

  var done3 = seq('1-3')


  done2(function(err,seq){
    t.equals(seq,'1-2','saved "1-2" to file')
  })

  done1(function(err,seq){
    t.equals(seq,'1-2','must have saved "1-2" instead of "'+seq+'" because both "1-1" and "1-2" are complete. [must save max done < floor started]')
  })

  done3(function(err,value){
    clearTimeout(timer)
    t.equals(value,'1-3','last one saves 1-3')
    t.equals(seq.value,'1-3','should update seq.value too')
  })


  // hold the test open for the unrefed timers to finish
  var timer = setTimeout(function(){ },5000)

})

