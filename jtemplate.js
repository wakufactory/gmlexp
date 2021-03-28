// template for javascript
//  version 1.3.2   2006/08/21
//  version 1.4.0   2009/01/21
//  for jQuery  2012/5/20
//  by wakufactory.jp
//  license: BSD

function JhtmlTemplate(obj,replacer){
	var temp_data ="" ;
	var lr ={} ;
	var lrf=[] ;
	var lrfc=0;
	var ex ="";
	var replace ={} ;
	if(replacer!=null) replace=replacer ;
	function addslashes(s) {
		s = s.replace(/\\/g,"\\\\" ) ;
		s = s.replace(/\"/g,'\\\"' ) ;
		s = s.replace(/\'/g,"\\\'" ) ;
		return s ;
	}
	String.prototype.addslashes = function(){return addslashes(this)} 
	String.prototype.htmlspecialchars = function(){
		var ch = this.replace(/&/g,"&amp;") ;
	    ch = ch.replace(/"/g,"&quot;") ;
	    ch = ch.replace(/'/g,"&#039;") ;
	    ch = ch.replace(/</g,"&lt;") ;
	    ch = ch.replace(/>/g,"&gt;") ;
	    return ch 
	}
	var re_mac = new RegExp(/(<\!--)?\[([a-z\/]+)([^\]]*)\](-->)?/i) ;
	var re_cmd = new RegExp(/(\/?)(r|u|s?)([a-z]+)/) ;
	function _prepare() {
		lr = {} ;
		lrf = [] ;
		lrfc=0;
		ex = addslashes(temp_data.replace(/\r|\n/g,"") );
		ex = ex.replace(/%5B/ig,"[" ) ;
		ex = ex.replace(/%5D/ig,"]" ) ;
		ex = ex.replace(/%20/ig," " ) ;
//alert(ex);
		var t = ex ;
		var s=[] ;
		var v,i,va,n,pp,vn ;
		while((i=t.search(re_mac))>=0 ) {
			var c = RegExp.$2 ;
			var p = RegExp.$3.substr(1) ;
			var len = RegExp.$1.length + RegExp.$2.length+RegExp.$3.length+RegExp.$4.length+2 ;
			
			if(c.match(re_cmd)) {
				switch(RegExp.$3) {
					case 'val':
						vn = "" ;
						if((pp = p.indexOf(" "))>0) {
							vn = p.substr(pp+1) ;
							p = p.substr(0,pp) ;
						}
						v = _getvalname2(p) ;
						va = v ;
						if(RegExp.$2=="") va += ".toString().htmlspecialchars().replace(/\\n/g,'</br>')" ;
						else if(RegExp.$2=="s" ) va += ".toString().addslashes()" ;
						s.push( "d.push( \""+t.substr(0,i)+ "\");try{if("+v+"!=undefined) d.push("+va+");}catch(err){};") ;
						if(vn !="") s.push( "else d.push('"+vn+"');") ;
						break;
					case 'idx':
						v = "" ;
						for(var j=0;j<lrfc;j++) {
							if(lrf[j]==p) {
								v = "lr['"+p+"']" ;
								break ;
							}
						}
						s.push( "d.push(\""+t.substr(0,i)+ "\");d.push("+v+");" );
						break;
					case 'oidx':
						v = "" ;
						for(var j=0;j<lrfc;j++) {
							if(lrf[j]==p) {
								v = "lr['"+p+"']%2" ;
								break ;
							}
						}
						s.push( "d.push(\""+t.substr(0,i)+ "\");d.push("+v+");" );
						break;
					case 'num':
						v = "" ;
						for(var j=0;j<lrfc;j++) {
							if(lrf[j]==p) {
								v = "lr['"+p+"']+1" ;
								break ;
							}
						}
						s.push( "d.push(\""+t.substr(0,i)+ "\");d.push("+v+");" );
						break;
					case 'def':
						if(RegExp.$1 !="/") {
							v = _getvalname2(p) ;
							if(RegExp.$2=="u") {
								s.push( "d.push(\""+t.substr(0,i)+"\");\nif(!"+v+"){\n " );
							}else {
								s.push( "d.push(\""+t.substr(0,i)+"\");\nif("+v+"){\n " );
							}
						} else {
							s.push("d.push(\""+t.substr(0,i)+"\");\n}\n ") ;
						}
						break ;
					case 'each':
						if( RegExp.$1 != "/" ) {
							va = p.split("/");
							n = _getvalname2(p) ;
							if( va.length>1 ) p=va[va.length-1];
							lrf[lrfc++]=p;
							s.push("d.push(\""+t.substr(0,i)+"\");\nif("+n+") for(lr['"+p+"']=0;lr['"+p+"']<"+n+".length;lr['"+p+"']++){\n ") ;
						} else {
							lrf[--lrfc]=null ;
							s.push( "d.push(\""+t.substr(0,i)+"\");\n}\n " );
						}
						break ;
					default:
						s.push( "d.push(\""+t.substr(0,i+len)+ "\");" );
						break ;
				}
			}
			t = t.substr(i+len) ;
		}
		s.push("d.push(\""+t+"\");");
		ex = s.join('') ;
//console.log(ex)
	}

	function _rf( k,v) {
		var f = replace[k] ;
		if(f) {
			if(typeof f == 'function') return f(v) ;
			else if(typeof f =='object')  return f[v] ;
		}
		else return v ;
	}

	function _getvalname2(key) {
		var a = key.split("/") ;
		var i,r,t ;
		for(i=0;i<a.length;i++) {
			t = "'"+a[i]+"'" ;
			for(var j=0;j<lrfc;j++) {
				if(lrf[j]==a[i]) t = "'"+a[i]+"'][lr['"+a[i]+"']" ;
			}
			a[i] = t ;
		}
		r =  "data["+a.join("][")+"]" ;
		if(replace[key]) r = "_rf('"+key+"',"+r+")" ;
		return r ;
	}

	this.extract =function(target_id,p) {
		var d =[];
		var data = p ;
		try { 
			eval(ex) ;
		} catch(err) {
			alert("Template evaluate error!\n"+err+"\n"+ex) ;
		}
//console.log(d)
		d = d.join("") ;
		if(target_id) document.getElementById(target_id).innerHTML= d  ;
		return d ;
	}

	this.setReplaceFunc = function(k,f) {
		if(typeof(k)=='object') replace = k ;
		else replace[k] = f ;
	}

	// load template file
	var pobj ;
	var fcallback = null ;
	this.setCallback = function(f) { fcallback = f ; } ;
	this._respfunc = function() {
		if (pobj.readyState == 4) {
			if (pobj.status == 200) {
				temp_data = pobj.responseText ;
				_prepare() ;
				if(fcallback) fcallback(true) ;
			} else {
				alert("load template file error!\n"+pobj.status) ;
				if(fcallback) fcallback(false); 
			}
		}
	}
	this.loadTempFile = function(f,callback) {
		fcallback = callback ;
		pobj = new XMLHttpRequest() ;
		pobj.onreadystatechange = this._respfunc ;
		pobj.open("GET",f,true ) ;
		pobj.send(null) ;
	}

	// constructor
	if(obj !=null &&  typeof(obj) == 'object' ) {
		temp_data = obj.innerHTML ;
		_prepare() ;
	} else if(obj!=undefined && obj!="") {
		temp_data = obj ;
		_prepare() ;
	}
}
