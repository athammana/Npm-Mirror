# concurrent-seq-file

makes it safe to work on multiple jobs identified by a sequence at the same time.

or more technically.. 

extends `seq-file` to save the lowest completed sequence number from active async processes.

```js
var seq = require('concurrent-seq-file')('./test.seq')
var importantJob = require('some imaginary important job')

// stream that emits {seq:numeric id,doc:{}}
var follower = ... 

follower.on('data',function(obj){
  var done = seq(obj.seq)
  importantJob(function(){
    done()
  })
})

```

or without seq-file. if you need to save in a database etc.


```js

loadFromDb(function(err,savedValue){

  var seq = require('concurrent-seq-file').starter(function(seq,cb){
    yourCustomSaveInDB(seq,function(err){
      cb(err)
    })
  },{savedValue:savedValue})

  var importantJob = require('some imaginary important job')

  // stream that emits {seq:numeric id,doc:{}}
  var follower = ... 

  follower.on('data',function(obj){
    var done = seq(obj.seq)
    importantJob(function(){
      done()
    })
  })

})

```

## api


- seq = exports(file[,options])
  - file - the file name to read the sequence from
  - options, optional 
  - returns the seq function.
  
- done = seq(sequenceId)
 - sequenceId is the next incrementing id number of the job you are starting.
 - returns done. call this when you are done with the job.

- seq = exports.starter(persist,options)
 - > use this if you dont want to use seq-file to persist the sequence. like if you need to save it to a db.
 - persist,  function(sequenceToSave,cb) a function that you would likle to use to save the sequence
   - cb,  cb(err,data)
 - returns done.  you call this function when you are done working on the job for the sequence. error is bubbled from the persist callback.
  
### notes

job timeouts must be implemented on top of this module. otherwise a job that gets lost in narnia will prvent a new sequence from ever being saved.




