var test = require('tape')

var seqFile = require('../')

test('can',function(t){
  t.plan(4)

  var seq = seqFile(__dirname+'/.test',{delay:200})
  
  var done1 = seq(1)

  var done2 = seq(2)

  var done3 = seq(3)


  done2(function(err,seq){
    t.equals(seq,2,'saved 2 to file')
  })

  done1(function(err,seq){
    t.equals(seq,2,'must have saved 2 instead of 1 because both 1 and 2 are complete. [must save max done < floor started]')
  })

  done3(function(err,value){
    clearTimeout(timer)
    t.equals(value,3,'last one saves 3')
    t.equals(seq.value,3,'should update seq.value too')
  })

  // hold the test open for the unrefed timers to finish
  var timer = setTimeout(function(){ },5000)

})

