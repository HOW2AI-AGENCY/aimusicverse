var fs = require('fs');
var d = JSON.parse(fs.readFileSync('eslint-output.json','utf8'));
var rh=0,rr=0, files={};
d.forEach(function(f){
  f.messages.forEach(function(m){
    var rid = m.ruleId;
    if(!rid) return;
    if(rid.indexOf("react-hooks") === 0){
      rh++; var k = f.filePath.split('\').join('/');
      files[k]=files[k]||[0,0]; files[k][0]++;
    }
    if(rid.indexOf("react-refresh") === 0){
      rr++; var k = f.filePath.split('\').join('/');
      files[k]=files[k]||[0,0]; files[k][1]++;
    }
  })
});
console.log('hooks:'+rh+' refresh:'+rr+' total:'+(rh+rr)+' files:'+Object.keys(files).length);
var arr=Object.keys(files).map(function(k){ return [k,files[k][0],files[k][1]] });
arr.sort(function(a,b){ return (b[1]+b[2])-(a[1]+a[2]) });
for(var i=0;i<25&&i<arr.length;i++){
  var e=arr[i], p=e[0];
  var parts=p.split('/');
  var sp = parts.slice(-3).join('/');
  console.log(sp+' h:'+e[1]+' r:'+e[2]);
}
