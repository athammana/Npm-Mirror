
var seq = require('./')('./test.seq')

var id = 0;

work()
work()
work()
work()
work()

//var done = seq(++id)
//console.log('should never pass ',id)

function work(){
  var _id = ++id;
  var done = seq(_id)
  setTimeout(function(){
    done(function(err,saved){
      log(_id,err,saved)
    });
    work();
  },Math.random()*1000)
}


function log(id,err,saved){
  console.log(JSON.stringify({id:id,err:err,saved:saved}))
}



