//make obj file
export {OBJM}
class OBJM {
constructor(center,vofs=0) {
	this.center = center 
	this.object=[]
	this.vidx = vofs
	this.vertexes = []
	this.surfaces = []
}
add(surface,opt) { 
	const len = this.latlng2length({lat:this.center[0],lng:this.center[1]})
	const vl = []
	const sl = []
	surface.forEach(s=>{
		const vf = [] 
		s.forEach((v,i)=>{
			if(i==s.length-1) return 
			vf.push([(v[1]-this.center[1])*len.lng,(v[0]-this.center[0])*len.lat,v[2]-this.center[2]])
		})
		vl.push(vf)
		let  sf = this.polydiv(vf)
//		let sf = [vf.map((v,i)=>i)]
		sf.forEach(v=>sl.push(v.map(v=>v+this.vidx)))
		this.vidx += vf.length
	})
	this.vertexes.push(vl)
	this.surfaces.push(sl)
	this.object.push({opt:opt,v:vl.flat(),s:sl})
//	console.log(this.vertexes)
//	console.log(this.surfaces)
}
makeobj(opt) {
	const l =[]
	if(opt && opt.meta) l.push(this.setmeta(opt.meta))
	let uvidx = 0
	this.object.forEach(o=>{
		if(o.opt && o.opt.meta) l.push(this.setmeta(o.opt.meta))
		if(o.opt && o.opt.group) l.push("g "+o.opt.group)
		o.v.forEach(v=>{
			l.push("v "+v.map(a=>this.round(a)).join(" "))
		})
		if(o.opt && o.opt.uv) {
			l.push("vt "+o.opt.uv[0]+" "+o.opt.uv[1])
			uvidx++
		}
		o.s.forEach(s=>{
			s = s.map(v=>(v+1))
			if(o.opt && o.opt.uv) {
				s = s.map(v=>v+"/"+uvidx)
			}
			l.push("f "+s.join(" "))
		})
	})
//	console.log(l)
	return l.join("\n")
}
setmeta(c) {
	return encodeURIComponent("# "+JSON.stringify(c))
}
round(v) {
	let s =  v.toString()
	const i = s.indexOf(".")
	if(i>-1) s = s.substr(0,i+3)
	return s  
}
latlng2length(latlng) {
	const r = 6356752
	const er = 2*Math.PI*r/360
	return {lng: Math.cos(latlng.lat / 180 * Math.PI) * er, lat:er}
}	
polydiv(v) {
	function cross(p0,p1,p2) {
		const v1 = [p1[0]-p0[0],p1[1]-p0[1],p1[2]-p0[2]]
		const v2 = [p2[0]-p0[0],p2[1]-p0[1],p2[2]-p0[2]]
		return  [	
			v1[1]*v2[2] - v1[2] * v2[1],
			v1[2]*v2[0] - v1[0] * v2[2],
			v1[0]*v2[1] - v1[1] * v2[0] 
		]		
	}
	function dot(v1,v2) {return v1[0]*v2[0]+v1[1]*v2[1]+v1[2]*v2[2]}

	//頂点の双方向リンクリストを作る
	let vl = v.map((v,i)=>{return {v:v,i:i}})
	vl.forEach((v,i)=>{v.next=vl[i<vl.length-1?i+1:0],v.prev=vl[i>0?i-1:vl.length-1]})
	//第１点を原点とする
	const zv = v[0]
	//原点からの距離で遠い順にソート
	vl.sort((a,b)=>{
		const da = Math.hypot(a.v[0]-zv[0],a.v[1]-zv[1],a.v[2]-zv[2])
		const db = Math.hypot(b.v[0]-zv[0],b.v[1]-zv[1],b.v[2]-zv[2])
		return db-da 
	})

	let rv = [] 
	let pi = vl[0] //一番遠い点から始める
	let cr = cross(pi.v,pi.next.v,pi.prev.v)	//最初の三角の外積
	let sc = 0 
	while(true) {
//		console.log(vl)
		const vi = pi.v	//注目点座標
		const vi1 = pi.next.v //次の点座標
		const vi2 = pi.prev.v	//前の点座標
 
		//cross(lv1-lv,lv2-lv) 
		const c = cross(vi,vi1,vi2)
		if(dot(c,cr)<0) {
//			console.log("reversse tri!")
			pi = pi.next
			if(++sc > vl.length) {
				console.log("**********err")
				console.log(vl)
				break 
			} 
			continue
		}
		// 三角形の中に他の点があるか調べる
		//現在の三角以外の各点を調べる 
		let f = false 
		for(let i =0,pt = pi.next.next ;i<vl.length-3;i++) {
			const c1 = cross(vi,pt.v,vi2)
			const c2 = cross(vi1,pt.v,vi)
			const c3 = cross(vi2,pt.v,vi1)

			if(dot(c1,c2)>0 && dot(c1,c3)>0 && dot(c2,c3)>0) {
//				console.log("inner point!")
				f = true 
				break 
			}
			pt = pt.next 
		}
		//他の点があれば 次の点に移動
		if(f) {
			pi = pi.next 
			continue		
		}
		// なかったら　三角を取り出して注視点を取り除く
		rv.push([pi.i,pi.next.i,pi.prev.i])
		pi.prev.next = pi.next
		pi.next.prev = pi.prev 
		vl = vl.filter(v=>v!==pi)
		
		// 残りが2点なら終了
		if(vl.length<3) break  
		pi = vl[0] // 次の点に移動	
		sc = 0 	
	}
	return rv 
}	

} // OBJM
